import { NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY as string,
  })
);

export async function POST() {
  try {
    const signer = await client.createSigner();
    const s = signer as any; // Bypass TS definition lag

    return NextResponse.json({ 
      signerUuid: s.signer_uuid, 
      link: s.link || s.signer_approval_url 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const signerUuid = searchParams.get('signerUuid');
  
  if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

  try {
    // FIX: Pass an object { signerUuid } instead of just the string
    const signer = await client.lookupSigner({ signerUuid });
    return NextResponse.json(signer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
