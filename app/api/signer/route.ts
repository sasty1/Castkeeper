import { NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// FIX: Use the Configuration object structure
const client = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY as string,
  })
);

export async function POST() {
  try {
    // Create a new signer
    const signer = await client.createSigner();
    
    return NextResponse.json({ 
      signerUuid: signer.signer_uuid, 
      link: signer.link 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Check status of a signer
  const { searchParams } = new URL(req.url);
  const signerUuid = searchParams.get('signerUuid');
  
  if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

  try {
    const signer = await client.lookupSigner(signerUuid);
    return NextResponse.json(signer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
