import { verifySignInMessage } from '@farcaster/auth-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Get the data from the request
    const { message, signature, domain, nonce } = await req.json();

    // 2. Verify using the correct OBJECT format
    const result = await verifySignInMessage({
      message,
      signature,
      domain,
      nonce,
    });

    // 3. Use 'success' (not 'valid') to check the result
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid signature', details: result.error }, { status: 401 });
    }

    // 4. Success! Return the FID
    return NextResponse.json({ 
      token: "session-" + result.fid, 
      fid: result.fid 
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
