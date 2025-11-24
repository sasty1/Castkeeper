import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST() {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: "Server Error: API Key missing" }, { status: 500 });
  }

  try {
    // 1. Create Signer
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": NEYNAR_API_KEY,
      },
      body: JSON.stringify({}) 
    });

    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: "Neynar Failed: " + responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    
    // 2. GET THE LINK (Or build it manually if missing)
    let approvalUrl = data.signer_approval_url || data.link;

    // FALLBACK: If Neynar didn't give us a link, we build one using the Public Key
    if (!approvalUrl && data.public_key) {
      console.log("Building manual approval link...");
      approvalUrl = "https://warpcast.com/~/add-signer?public_key=" + data.public_key + "&name=CastKeeper";
    }

    if (!approvalUrl) {
      return NextResponse.json({ error: "Failed to generate approval link." }, { status: 500 });
    }
    
    return NextResponse.json({ 
      signerUuid: data.signer_uuid, 
      link: approvalUrl 
    });

  } catch (error: any) {
    console.error("Signer Creation Crash:", error);
    return NextResponse.json({ error: "Server Crash: " + error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const signerUuid = searchParams.get('signerUuid');
    
    if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    const response = await fetch("https://api.neynar.com/v2/farcaster/signer?signer_uuid=" + signerUuid, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-api-key": NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) return NextResponse.json({ status: "pending" });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
