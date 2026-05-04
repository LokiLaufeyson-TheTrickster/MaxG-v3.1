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
  console.log('Groww API Proxy request received');
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

    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
    };

    if (cached && cached.expiry > Date.now()) {
      sessionToken = cached.token;
      lastStep = 'use_cached_token';
    } else {
      lastStep = 'validate_totp_secret';
      // Basic validation: Base32 (TOTP Secret) shouldn't have dots or underscores.
      // JWTs (API Key) almost always have dots and often underscores.
      if (totpSecret.includes('.') || totpSecret.includes('_')) {
        return NextResponse.json({ 
          error: 'It looks like you entered your Groww API Key (JWT) into the "Groww TOTP Secret" field. Please swap them in the settings.',
          step: lastStep 
        }, { status: 400 });
      }

      lastStep = 'generate_totp';
      try {
        const totp = new OTPAuth.TOTP({
          secret: totpSecret.replace(/\s/g, '').toUpperCase(),
          digits: 6,
          period: 30,
          algorithm: 'SHA1',
        });
        const code = totp.generate();

        lastStep = 'fetch_access_token';
        const authRes = await fetch('https://api.groww.in/v1/token/api/access', {
          method: 'POST',
          headers: {
            ...commonHeaders,
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
      } catch (totpErr: any) {
        return NextResponse.json({ 
          error: `TOTP Generation failed: ${totpErr.message}. Ensure your TOTP Secret is a valid Base32 string.`,
          step: lastStep 
        }, { status: 400 });
      }
    }


    lastStep = 'fetch_expiries';
    const expiryRes = await fetch(`https://api.groww.in/v1/historical/expiries?exchange=NSE&underlying_symbol=NIFTY`, {
      headers: {
        ...commonHeaders,
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!expiryRes.ok) {
      const err = await safeJson(expiryRes).catch(() => ({}));
      return NextResponse.json({ error: 'Failed to fetch expiries', details: err, step: lastStep }, { status: expiryRes.status });
    }

    const expiries = await safeJson(expiryRes);
    let nearestExpiry = '';
    
    // Log for debugging (will show in Vercel logs)
    console.log('Expiries response:', JSON.stringify(expiries));

    if (Array.isArray(expiries)) {
      const first = expiries[0];
      if (typeof first === 'object' && first !== null) {
        nearestExpiry = (first as any).expiry_date || (first as any).expiryDate || (first as any).expiry || '';
      } else if (typeof first === 'string') {
        nearestExpiry = first;
      }
    } else if (typeof expiries === 'object' && expiries !== null) {
      // Sometimes it's a map or a nested object
      const values = Object.values(expiries);
      const first = values[0];
      if (typeof first === 'object' && first !== null) {
        nearestExpiry = (first as any).expiry_date || (first as any).expiryDate || (first as any).expiry || '';
      } else if (typeof first === 'string') {
        nearestExpiry = first;
      }
    }


    // Clean the date (ensure it's YYYY-MM-DD)
    if (nearestExpiry && typeof nearestExpiry === 'string') {
      nearestExpiry = nearestExpiry.trim();
      // Handle full ISO string (2026-05-07T00:00:00.000Z)
      if (nearestExpiry.includes('T')) nearestExpiry = nearestExpiry.split('T')[0];
      
      // Handle DD-MM-YYYY format
      if (/^\d{2}-\d{2}-\d{4}$/.test(nearestExpiry)) {
        const [d, m, y] = nearestExpiry.split('-');
        nearestExpiry = `${y}-${m}-${d}`;
      }
      
      // Handle DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(nearestExpiry)) {
        const [d, m, y] = nearestExpiry.split('/');
        nearestExpiry = `${y}-${m}-${d}`;
      }
    }

    if (!nearestExpiry) {
      return NextResponse.json({ 
        error: 'No valid expiry date found in response', 
        details: expiries, 
        step: lastStep 
      }, { status: 404 });
    }

    lastStep = 'fetch_option_chain';
    const chainUrl = `https://api.groww.in/v1/option-chain/exchange/NSE/underlying/NIFTY?expiry_date=${nearestExpiry}`;
    const chainRes = await fetch(chainUrl, {
      headers: {
        ...commonHeaders,
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!chainRes.ok) {
      const err = await safeJson(chainRes).catch(() => ({}));
      return NextResponse.json({ 
        error: 'Failed to fetch option chain', 
        details: err, 
        expiry_used: nearestExpiry,
        url_called: chainUrl,
        step: lastStep 
      }, { status: chainRes.status });
    }



    const chainData = await safeJson(chainRes);
    return NextResponse.json(chainData);

  } catch (error: any) {
    console.error(`Groww API Proxy Error at ${lastStep}:`, error);
    return NextResponse.json({ 
      error: error.message, 
      step: lastStep,
      stack: error.stack
    }, { status: 500 });
  }
}


