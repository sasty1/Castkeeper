import { NextResponse } from 'next/server';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// FIX 1: We now use the Configuration object instead of just a string
const client = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY as string,
  })
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { castText, signerUuid } = body;

    if (!castText || !signerUuid) {
      return NextResponse.json({ success: false, error: 'Missing text or signer' }, { status: 400 });
    }

    // FIX 2: publishCast now expects an object, not separate arguments
    await client.publishCast({
      signerUuid,
      text: castText
    });

    return NextResponse.json({ success: true, message: 'Cast published' });
  } catch (error: any) {
    console.error('Cast Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to cast' }, { status: 500 });
  }
}
