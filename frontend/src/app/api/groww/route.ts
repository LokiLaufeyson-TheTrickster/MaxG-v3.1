import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

// Simple in-memory cache for session tokens
const sessionCache = new Map<string, { token: string, expiry: number }>();

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
      // Generate TOTP
      const totp = new OTPAuth.TOTP({
        secret: totpSecret.replace(/\s/g, ''),
        digits: 6,
        period: 30,
        algorithm: 'SHA1',
      });
      const code = totp.generate();

      // Get Access Token
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
        const errorData = await authRes.json();
        return NextResponse.json({ error: 'Auth failed', details: errorData }, { status: authRes.status });
      }

      const authData = await authRes.json();
      sessionToken = authData.token;

      // Cache for 30 minutes (tokens usually last longer)
      sessionCache.set(cacheKey, { 
        token: sessionToken, 
        expiry: Date.now() + 30 * 60 * 1000 
      });
    }

    // Now fetch Nifty Data (Option Chain)
    // We'll use a hardcoded expiry or find the next one
    // For now, let's try to get expiries first
    const expiryRes = await fetch(`https://api.groww.in/v1/historical/expiries?exchange=NSE&underlying_symbol=NIFTY`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-client-id': 'growwapi',
      },
    });

    if (!expiryRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch expiries' }, { status: expiryRes.status });
    }

    const expiries = await expiryRes.json();
    const nearestExpiry = expiries[0]; // Assuming it's sorted

    // Fetch Option Chain
    const chainRes = await fetch(`https://api.groww.in/v1/option-chain/exchange/NSE/underlying/NIFTY?expiry_date=${nearestExpiry}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-client-id': 'growwapi',
      },
    });

    if (!chainRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch option chain' }, { status: chainRes.status });
    }

    const chainData = await chainRes.json();
    return NextResponse.json(chainData);

  } catch (error: any) {
    console.error('Groww API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
