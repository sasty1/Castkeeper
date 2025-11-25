import { verifySignInMessage } from '@farcaster/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { signature, message } = await req.json();
    
    // Verify the signature implies ownership of the FID
    const { valid, fid } = await verifySignInMessage(signature, message);
    
    if (!valid) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
    
    // In a real app, you would create a session JWT here. 
    // For now, we return the FID and success status.
    return NextResponse.json({ success: true, fid });
    
  } catch (error) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
