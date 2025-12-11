import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function POST() {
  try {
    const signer = await client.createSigner();
    return NextResponse.json(signer);
  } catch (error) {
    console.error('Error creating signer:', error);
    return NextResponse.json(
      { error: 'Failed to create signer' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const signerUuid = searchParams.get('signerUuid');

  if (!signerUuid) {
    return NextResponse.json(
      { error: 'signerUuid is required' },
      { status: 400 }
    );
  }

  try {
    const signer = await client.lookupSigner({ signerUuid });
    return NextResponse.json(signer);
  } catch (error) {
    console.error('Error fetching signer status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signer status' },
      { status: 500 }
    );
  }
}
