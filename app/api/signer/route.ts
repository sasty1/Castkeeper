import { NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

// 1. Force Next.js to run this dynamically (fixes Vercel env var issues)
export const dynamic = 'force-dynamic';

// 2. Ensure API Key is present
const apiKey = process.env.NEYNAR_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: NEYNAR_API_KEY is missing!");
}

// 3. Initialize Client (Simplified)
// We pass the object directly instead of using new Configuration()
const client = new NeynarAPIClient({
  apiKey: apiKey || "dummy_key", 
});

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
    }

    console.log("Attempting to create signer...");
    const signer = await client.createSigner();
    
    // Cast to any to avoid TypeScript strictness
    const s = signer as any;
    console.log("Signer created:", s.signer_uuid);

    return NextResponse.json({ 
      signerUuid: s.signer_uuid, 
      link: s.link || s.signer_approval_url 
    });
  } catch (error: any) {
    console.error("Signer POST Error:", error);
    return NextResponse.json({ error: error.message || "Unknown error creating signer" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const signerUuid = searchParams.get('signerUuid');
    
    if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    const signer = await client.lookupSigner({ signerUuid });
    return NextResponse.json(signer);
  } catch (error: any) {
    console.error("Signer GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
