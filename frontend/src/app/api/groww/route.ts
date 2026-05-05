import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

// Simple in-memory cache for session tokens
const sessionCache = new Map<string, { token: string, expiry: number }>();

async function safeJson(response: Response) {
  try {
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Helper to try parsing text as JSON
    const tryParse = (text: string) => {
      // 1. Remove all control characters, null bytes, and BOMs
      // This is the most aggressive possible cleaning
      const clean = text
        .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFFE\uFFFD]/g, '')
        .trim();
      
      const firstBrace = clean.indexOf('{');
      const firstBracket = clean.indexOf('[');
      const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
      
      const lastBrace = clean.lastIndexOf('}');
      const lastBracket = clean.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);
      
      if (start !== -1 && end !== -1 && end > start) {
        const jsonText = clean.substring(start, end + 1);
        try { 
          return JSON.parse(jsonText); 
        } catch (e) { 
          // Last ditch effort: remove everything that isn't valid JSON character
          const superClean = jsonText.replace(/[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\{\}\[\]\":,0-9.-]/g, '');
          try { return JSON.parse(superClean); } catch {
            return { error: 'Parse Error', raw: jsonText.substring(0, 200) };
          }
        }
      }
      return null;
    };

    // 1. Try UTF-16LE (Most common for Groww's error responses)
    const text16le = new TextDecoder('utf-16le').decode(bytes);
    const json16le = tryParse(text16le);
    if (json16le) return json16le;

    // 2. Try UTF-16BE
    const text16be = new TextDecoder('utf-16be').decode(bytes);
    const json16be = tryParse(text16be);
    if (json16be) return json16be;

    // 3. Try UTF-8
    const text8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const json8 = tryParse(text8);
    if (json8) return json8;

    // Fallback: If nothing parsed but we have text, return it raw
    const rawText = text8 || text16le;
    if (rawText.length > 0 && rawText.length < 1000) return { raw: rawText };

    throw new Error('Could not parse response as JSON in any encoding');
  } catch (error: any) {
    throw new Error(`Groww API Parse Failure: ${error.message}`);
  }
}

export async function POST(request: Request) {
  let lastStep = 'initialization';
  try {
    const body = await request.json().catch(() => ({}));
    const { apiKey, totpSecret, action } = body;

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
      'X-API-VERSION': '1.0'
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
          const rawErr = await authRes.text();
          let errorData;
          try {
             errorData = JSON.parse(rawErr);
          } catch {
             errorData = { raw: rawErr };
          }
          return NextResponse.json({ 
            error: 'Groww Authentication Failed', 
            details: errorData, 
            step: lastStep,
            status: authRes.status,
            hint: 'Ensure your GROWW_TOTP_TOKEN (JWT) is fresh and your TOTP Secret is correct.'
          }, { status: authRes.status });
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


    if (action === 'getVix') {
      lastStep = 'fetch_vix';
      const vixUrl = `https://api.groww.in/v1/live_index/v1/index/INDIAVIX`;
      const vixRes = await fetch(vixUrl, {
        headers: {
          ...commonHeaders,
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!vixRes.ok) {
        const err = await safeJson(vixRes).catch(() => ({}));
        return NextResponse.json({ 
          error: 'Failed to fetch VIX', 
          details: err, 
          url_called: vixUrl,
          step: lastStep 
        }, { status: vixRes.status });
      }

      const vixData = await safeJson(vixRes);
      return NextResponse.json(vixData);
    }

    if (action === 'getCandles') {
      lastStep = 'fetch_historical_candles';
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
      
      const formatTime = (d: Date) => d.toISOString().replace('T', ' ').split('.')[0];
      
      const candleUrl = `https://api.groww.in/v1/historical/candles?groww_symbol=NSE-NIFTY&exchange=NSE&segment=CASH&start_time=${formatTime(startTime)}&end_time=${formatTime(endTime)}&candle_interval=1minute`;
      const candleRes = await fetch(candleUrl, {
        headers: {
          ...commonHeaders,
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!candleRes.ok) {
        const err = await safeJson(candleRes).catch(() => ({}));
        return NextResponse.json({ 
          error: 'Failed to fetch candles', 
          details: err, 
          url_called: candleUrl,
          step: lastStep 
        }, { status: candleRes.status });
      }

      const candleData = await safeJson(candleRes);
      return NextResponse.json(candleData);
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
    
    // Log for debugging
    console.log('Expiries response:', JSON.stringify(expiries).substring(0, 500));
    
    const isDate = (s: any) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.split('T')[0]);

    const findDate = (obj: any): string => {
      if (!obj) return '';
      if (isDate(obj)) return obj.split('T')[0];
      
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (isDate(item)) return item.split('T')[0];
          if (typeof item === 'object' && item !== null) {
            const d = item.expiry_date || item.expiryDate || item.expiry;
            if (isDate(d)) return d.split('T')[0];
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        const data = obj.data || obj.expiries || obj.values;
        if (data) {
          const d = findDate(data);
          if (d) return d;
        }
        for (const val of Object.values(obj)) {
          const d = findDate(val);
          if (d) return d;
        }
      }
      return '';
    };

    let nearestExpiry = findDate(expiries);

    if (!nearestExpiry) {
      return NextResponse.json({ 
        error: 'No valid expiry date found in response', 
        details: expiries, 
        step: lastStep 
      }, { status: 404 });
    }

    // Clean the date (ensure it's YYYY-MM-DD)
    if (nearestExpiry && typeof nearestExpiry === 'string') {
      nearestExpiry = nearestExpiry.trim();
      if (nearestExpiry.includes('T')) nearestExpiry = nearestExpiry.split('T')[0];
      if (/^\d{2}-\d{2}-\d{4}$/.test(nearestExpiry)) {
        const [d, m, y] = nearestExpiry.split('-');
        nearestExpiry = `${y}-${m}-${d}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(nearestExpiry)) {
        const [d, m, y] = nearestExpiry.split('/');
        nearestExpiry = `${y}-${m}-${d}`;
      }
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

}


