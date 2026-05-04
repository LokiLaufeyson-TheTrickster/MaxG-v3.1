import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

// Simple in-memory cache for session tokens
const sessionCache = new Map<string, { token: string, expiry: number }>();

async function safeJson(response: Response) {
  try {
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Log for debugging
    console.log(`Response Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    
    // Check for GZIP signature (1f 8b) - just in case it's not handled
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      console.warn('Response appears to be GZIP encoded but was not decompressed by fetch.');
    }

    let text = '';
    // Detect UTF-16 BOM
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      text = new TextDecoder('utf-16le').decode(bytes.slice(2));
    } else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      text = new TextDecoder('utf-16be').decode(bytes.slice(2));
    } else {
      text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    }

    // Clean the text: remove BOM, null bytes, and non-printable chars at start
    const cleanText = text
      .replace(/^[\uFEFF\uFFFE\u0000-\u001F\u007F-\u009F\uFFFD]+/, '')
      .trim();
    
    // Find the first occurrence of { or [ and the last occurrence of } or ]
    const firstBrace = cleanText.search(/[\{\[]/);
    const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON structure found in response');
    }
    
    const jsonText = cleanText.substring(firstBrace, lastBrace + 1);
    
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse JSON. JSON text snippet:', jsonText.substring(0, 200));
      throw e;
    }
  } catch (error: any) {
    console.error('safeJson Error:', error.message);
    throw new Error(`Upstream API Response Error: ${error.message}`);
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
        const errorData = await safeJson(authRes).catch(() => ({ msg: 'Auth failed' }));
        return NextResponse.json({ error: 'Auth failed', details: errorData }, { status: authRes.status });
      }

      const authData = await safeJson(authRes);
      sessionToken = authData.token;

      sessionCache.set(cacheKey, { 
        token: sessionToken, 
        expiry: Date.now() + 30 * 60 * 1000 
      });
    }

    // Fetch expiries
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

    // Fetch Option Chain
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

