import { NextResponse } from 'next/server';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { castText, signerUuid } = body;

    if (!castText || !signerUuid) {
      return NextResponse.json({ success: false, error: 'Missing text or signer' }, { status: 400 });
    }

    await client.publishCast(signerUuid, castText);

    return NextResponse.json({ success: true, message: 'Cast published' });
  } catch (error: any) {
    console.error('Cast Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to cast' }, { status: 500 });
  }
}	

