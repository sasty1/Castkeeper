import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST() {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: "Server: Missing API Key" }, { status: 500 });
  }

  try {
    // 1. Request a Signer directly from Neynar API (Bypassing SDK)
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("Neynar API Failed: " + errText);
    }

    const data = await response.json();
    
    // 2. Return the data needed for the frontend
    return NextResponse.json({ 
      signerUuid: data.signer_uuid, 
      link: data.signer_approval_url 
    });

  } catch (error: any) {
    console.error("Signer POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const signerUuid = searchParams.get('signerUuid');
    
    if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    // 3. Check Signer Status directly
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer?signer_uuid=" + signerUuid, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "api_key": NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch signer status");
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Signer GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
