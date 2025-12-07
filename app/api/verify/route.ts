import { verifySignInMessage, type SignInMessage } from '@farcaster/auth-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Get the data from the request
    const body = await req.json();
    
    console.log('Received sign-in data:', body);

    // 2. Parse the message if it's a string
    const message: SignInMessage = typeof body.message === 'string' 
      ? JSON.parse(body.message)
      : body.message;

    // 3. Verify - pass the parsed message and signature as first arg
    const result = await verifySignInMessage(
      message,
      {
        signature: body.signature,
        domain: body.domain,
        nonce: body.nonce
      }
    );

    console.log('Verification result:', result);

    // 4. Check if verification was successful
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid signature', 
        details: result.error 
      }, { status: 401 });
    }

    // 5. Success! Return the FID
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
