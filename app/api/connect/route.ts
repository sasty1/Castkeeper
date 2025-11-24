import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST() {
  console.log("--- DEBUG: STARTING CONNECT POST ---");

  if (!NEYNAR_API_KEY) {
    console.error("❌ ERROR: NEYNAR_API_KEY is missing in Vercel!");
    return NextResponse.json({ error: "Server Error: API Key missing" }, { status: 500 });
  }

  try {
    // 1. Request a Signer directly from Neynar API (Raw Fetch)
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": NEYNAR_API_KEY,
      },
    });

    const responseText = await response.text();
    console.log("Neynar Response:", responseText);

    if (!response.ok) {
      return NextResponse.json({ error: "Neynar Failed: " + responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({ 
      signerUuid: data.signer_uuid, 
      link: data.signer_approval_url 
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
        "api_key": NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      // If pending, just return status without erroring
      return NextResponse.json({ status: "pending" });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
