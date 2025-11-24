import { NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Ensure API Key exists
const apiKey = process.env.NEYNAR_API_KEY;
if (!apiKey) {
  console.error("❌ NEYNAR_API_KEY is missing in environment variables!");
}

const client = new NeynarAPIClient(
  new Configuration({
    apiKey: apiKey || "DUMMY_KEY_TO_PREVENT_CRASH",
  })
);

export async function POST() {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Server Error: Missing API Key" }, { status: 500 });
    }

    const signer = await client.createSigner();
    const s = signer as any;

    return NextResponse.json({ 
      signerUuid: s.signer_uuid, 
      link: s.link || s.signer_approval_url 
    });
  } catch (error: any) {
    console.error("Signer Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create signer" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Safer URL parsing
    const url = new URL(req.url);
    const signerUuid = url.searchParams.get('signerUuid');
    
    if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    const signer = await client.lookupSigner({ signerUuid });
    return NextResponse.json(signer);
  } catch (error: any) {
    console.error("Signer Lookup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
