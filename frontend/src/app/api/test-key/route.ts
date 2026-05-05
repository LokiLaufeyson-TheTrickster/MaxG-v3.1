import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

export async function POST(request: Request) {
  try {
    const { type, value, extra } = await request.json();

    if (!value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    switch (type) {
      case 'github':
        const ghRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${value}` }
        });
        if (ghRes.ok) return NextResponse.json({ success: true });
        const ghErr = await ghRes.json();
        return NextResponse.json({ error: ghErr.message || 'Invalid token' }, { status: ghRes.status });

      case 'groww_totp':
        try {
          const totp = new OTPAuth.TOTP({
            secret: value.replace(/\s/g, '').toUpperCase(),
            digits: 6,
            period: 30,
            algorithm: 'SHA1',
          });
          totp.generate();
          return NextResponse.json({ success: true });
        } catch (e: any) {
          return NextResponse.json({ error: `Invalid TOTP Secret: ${e.message}` }, { status: 400 });
        }

      case 'groww_api':
        // extra is the TOTP secret
        if (!extra) return NextResponse.json({ error: 'TOTP Secret required for API test' }, { status: 400 });
        const totp = new OTPAuth.TOTP({
          secret: extra.replace(/\s/g, '').toUpperCase(),
          digits: 6,
          period: 30,
          algorithm: 'SHA1',
        });
        const code = totp.generate();
        const growwRes = await fetch('https://api.groww.in/v1/token/api/access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${value}`,
          },
          body: JSON.stringify({ key_type: 'totp', totp: code }),
        });
        if (growwRes.ok) return NextResponse.json({ success: true });
        return NextResponse.json({ error: `Auth failed: ${growwRes.status}` }, { status: growwRes.status });

      case 'gemini':
        const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${value}`);
        if (gemRes.ok) return NextResponse.json({ success: true });
        const gemErr = await gemRes.json();
        return NextResponse.json({ error: gemErr.error?.message || 'Invalid Gemini Key' }, { status: gemRes.status });

      case 'openrouter':
        const orRes = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${value}` }
        });
        if (orRes.ok) return NextResponse.json({ success: true });
        return NextResponse.json({ error: 'Invalid OpenRouter Key' }, { status: orRes.status });

      default:
        return NextResponse.json({ error: 'Unknown test type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
