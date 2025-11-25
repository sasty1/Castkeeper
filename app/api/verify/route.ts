import { verifySignInMessage } from '@farcaster/auth-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, signature } = await req.json();

    // 1. Verify using the new signature format (message, signature)
    const { valid, fid } = await verifySignInMessage(message, signature);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Optional: extra domain check (recommended)
    const domain = new URL(req.headers.get('origin') || '').hostname;
    if (message.includes(domain)) {
      // (Optional logic: You can enforce domain matching here if needed)
    }

    // 3. Create your session
    const token = "dummy-jwt-for-fid-" + fid; 

    return NextResponse.json({ token, fid });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
