import { verifySignInMessage } from '@farcaster/auth-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { signature, message } = await req.json();
    
    // 1. Verify that the signature matches the message and comes from the claimed FID
    const result = await verifySignInMessage({
      message,
      signature,
      domain: 'castkeeper-tsf3.vercel.app', // Optional: helps with security checks
    });

    // 2. Check if verification passed
    if (!result.isSuccess) {
      return NextResponse.json({ error: 'Invalid signature', details: result.error }, { status: 401 });
    }

    // 3. Return the FID (User ID) to the frontend
    return NextResponse.json({ 
      success: true, 
      fid: result.fid 
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
