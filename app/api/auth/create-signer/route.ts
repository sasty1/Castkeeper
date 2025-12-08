import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();
    
    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    // Create a managed signer using Neynar API
    const response = await fetch('https://api.neynar.com/v2/farcaster/signer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
      },
      body: JSON.stringify({
        fid: fid,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Neynar signer creation error:', error);
      return NextResponse.json({ error: 'Failed to create signer' }, { status: 500 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      signer_uuid: data.signer_uuid,
      public_key: data.public_key,
      status: data.status,
      signer_approval_url: data.signer_approval_url,
    });

  } catch (error: any) {
    console.error('Create signer error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}
