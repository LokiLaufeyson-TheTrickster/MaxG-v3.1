import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

// Simple in-memory cache for session tokens
const sessionCache = new Map<string, { token: string, expiry: number }>();

async function safeJson(response: Response) {
  const text = await response.text();
  // Strip BOM if present (U+FEFF)
  const cleanText = text.replace(/^\uFEFF/, '');
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error('Failed to parse JSON:', cleanText.substring(0, 100));
    throw new Error('Invalid JSON response from upstream API');
  }
}

export async function POST(request: Request) {
  try {
    const { apiKey, totpSecret } = await request.json();

    if (!apiKey || !totpSecret) {
      return NextResponse.json({ error: 'API Key and TOTP Secret are required' }, { status: 400 });
    }

    const cacheKey = `${apiKey}-${totpSecret}`;
    const cached = sessionCache.get(cacheKey);
    let sessionToken = '';

    if (cached && cached.expiry > Date.now()) {
      sessionToken = cached.token;
    } else {
      console.log('Refreshing session token...');
      const totp = new OTPAuth.TOTP({
        secret: totpSecret.replace(/\s/g, ''),
        digits: 6,
        period: 30,
        algorithm: 'SHA1',
      });
      const code = totp.generate();

      const authRes = await fetch('https://api.groww.in/v1/token/api/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-client-id': 'growwapi',
        },
        body: JSON.stringify({
          key_type: 'totp',
          totp: code,
        }),
      });

      if (!authRes.ok) {
        const errorData = await safeJson(authRes);
        return NextResponse.json({ error: 'Auth failed', details: errorData }, { status: authRes.status });
      }

      const authData = await safeJson(authRes);
      sessionToken = authData.token;

      sessionCache.set(cacheKey, { 
        token: sessionToken, 
        expiry: Date.now() + 30 * 60 * 1000 
      });
    }

    const expiryRes = await fetch(`https://api.groww.in/v1/historical/expiries?exchange=NSE&underlying_symbol=NIFTY`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-client-id': 'growwapi',
      },
    });

    if (!expiryRes.ok) {
      const err = await safeJson(expiryRes).catch(() => ({}));
      return NextResponse.json({ error: 'Failed to fetch expiries', details: err }, { status: expiryRes.status });
    }

    const expiries = await safeJson(expiryRes);
    const nearestExpiry = Array.isArray(expiries) ? expiries[0] : null;

    if (!nearestExpiry) {
      return NextResponse.json({ error: 'No active expiries found' }, { status: 404 });
    }

    const chainRes = await fetch(`https://api.groww.in/v1/option-chain/exchange/NSE/underlying/NIFTY?expiry_date=${nearestExpiry}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-client-id': 'growwapi',
      },
    });

    if (!chainRes.ok) {
      const err = await safeJson(chainRes).catch(() => ({}));
      return NextResponse.json({ error: 'Failed to fetch option chain', details: err }, { status: chainRes.status });
    }

    const chainData = await safeJson(chainRes);
    return NextResponse.json(chainData);

  } catch (error: any) {
    console.error('Groww API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

