import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  const signature = searchParams.get('signature');

  if (!message || !signature) {
    return NextResponse.json(
      { error: 'Message and signature are required' },
      { status: 400 }
    );
  }

  try {
    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });
    const data = await client.fetchSigners({ 
      message, 
      signature 
    });
    return NextResponse.json({ signers: data.signers });
  } catch (error) {
    console.error('Error fetching signers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signers' },
      { status: 500 }
    );
  }
}
