import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET() {
  try {
    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });
    const response = await client.fetchNonce();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching nonce:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nonce' },
      { status: 500 }
    );
  }
}
