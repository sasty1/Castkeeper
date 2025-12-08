import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange code for signer using Neynar API
    const response = await fetch('https://api.neynar.com/v2/farcaster/login/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Neynar API error:', error);
      return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
    }

    const data = await response.json();
    
    // Return user data and signer
    return NextResponse.json({
      fid: data.fid,
      signer_uuid: data.signer_uuid,
      username: data.username,
      pfp: data.pfp_url,
    });

  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}
