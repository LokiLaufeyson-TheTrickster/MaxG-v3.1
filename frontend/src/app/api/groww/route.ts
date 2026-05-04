import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

// Simple in-memory cache for session tokens
const sessionCache = new Map<string, { token: string, expiry: number }>();

async function safeJson(response: Response) {
  try {
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    let text = '';
    // Detect UTF-16 BOM
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      text = new TextDecoder('utf-16le').decode(bytes.slice(2));
    } else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      text = new TextDecoder('utf-16be').decode(bytes.slice(2));
    } else {
      text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    }

    const cleanText = text
      .replace(/^[\uFEFF\uFFFE\u0000-\u001F\u007F-\u009F\uFFFD]+/, '')
      .trim();
    
    const firstBrace = cleanText.search(/[\{\[]/);
    const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
    
    if (firstBrace === -1 || lastBrace === -1) {
      // If no JSON found, return the raw text for debugging if it's short
      if (cleanText.length < 500) return { raw: cleanText };
      throw new Error('No JSON structure found in response');
    }
    
    const jsonText = cleanText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonText);
  } catch (error: any) {
    throw new Error(`JSON Parse Error: ${error.message}`);
  }
}

export async function POST(request: Request) {
  let lastStep = 'initialization';
  try {
    const { apiKey, totpSecret } = await request.json();
    lastStep = 'parse_request_body';

    if (!apiKey || !totpSecret) {
      return NextResponse.json({ error: 'API Key and TOTP Secret are required', step: lastStep }, { status: 400 });
    }

    const cacheKey = `${apiKey}-${totpSecret}`;
    const cached = sessionCache.get(cacheKey);
    let sessionToken = '';

    if (cached && cached.expiry > Date.now()) {
      sessionToken = cached.token;
      lastStep = 'use_cached_token';
    } else {
      lastStep = 'generate_totp';
      const totp = new OTPAuth.TOTP({
        secret: totpSecret.replace(/\s/g, ''),
        digits: 6,
        period: 30,
        algorithm: 'SHA1',
      });
      const code = totp.generate();

      lastStep = 'fetch_access_token';
      const authRes = await fetch('https://api.groww.in/v1/token/api/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          key_type: 'totp',
          totp: code,
        }),
      });

      if (!authRes.ok) {
        const errorData = await safeJson(authRes).catch(() => ({ msg: 'Auth failed' }));
        return NextResponse.json({ error: 'Auth failed', details: errorData, step: lastStep }, { status: authRes.status });
      }

      const authData = await safeJson(authRes);
      sessionToken = authData.token;

      if (!sessionToken) {
        throw new Error('Token not found in auth response');
      }

      sessionCache.set(cacheKey, { 
        token: sessionToken, 
        expiry: Date.now() + 30 * 60 * 1000 
      });
    }

    lastStep = 'fetch_expiries';
    const expiryRes = await fetch(`https://api.groww.in/v1/historical/expiries?exchange=NSE&underlying_symbol=NIFTY`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!expiryRes.ok) {
      const err = await safeJson(expiryRes).catch(() => ({}));
      return NextResponse.json({ error: 'Failed to fetch expiries', details: err, step: lastStep }, { status: expiryRes.status });
    }

    const expiries = await safeJson(expiryRes);
    const nearestExpiry = Array.isArray(expiries) ? expiries[0] : (typeof expiries === 'object' ? Object.values(expiries)[0] : null);

    if (!nearestExpiry) {
      return NextResponse.json({ error: 'No active expiries found', details: expiries, step: lastStep }, { status: 404 });
    }

    lastStep = 'fetch_option_chain';
    const chainRes = await fetch(`https://api.groww.in/v1/option-chain/exchange/NSE/underlying/NIFTY?expiry_date=${nearestExpiry}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!chainRes.ok) {
      const err = await safeJson(chainRes).catch(() => ({}));
      return NextResponse.json({ error: 'Failed to fetch option chain', details: err, step: lastStep }, { status: chainRes.status });
    }

    const chainData = await safeJson(chainRes);
    return NextResponse.json(chainData);

  } catch (error: any) {
    console.error(`Groww API Proxy Error at ${lastStep}:`, error);
    return NextResponse.json({ 
      error: error.message, 
      step: lastStep,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}


