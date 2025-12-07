import { verifySignInMessage } from '@farcaster/auth-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Get the data from the request
    const body = await req.json();
    
    console.log('Received sign-in data:', body);

    // 2. Verify - the function expects { nonce, message, signature, domain }
    const result = await verifySignInMessage({
      nonce: body.nonce,
      message: body.message,
      signature: body.signature,
      domain: body.domain
    });

    console.log('Verification result:', result);

    // 3. Check if verification was successful
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid signature', 
        details: result.error 
      }, { status: 401 });
    }

    // 4. Success! Return the FID
    return NextResponse.json({ 
      token: "session-" + result.fid, 
      fid: result.fid 
    });

  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}
