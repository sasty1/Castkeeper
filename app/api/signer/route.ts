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
    
    // FIX: Cast to 'any' because TypeScript definitions are lagging behind the actual API response
    const s = signer as any;

    return NextResponse.json({ 
      signerUuid: s.signer_uuid, 
      // The SDK sometimes calls it 'link' and sometimes 'signer_approval_url'
      // We check both to be safe.
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
    const signer = await client.lookupSigner(signerUuid);
    return NextResponse.json(signer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
