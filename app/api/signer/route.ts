import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("--- DEBUG: STARTING SIGNER POST ---");
  
  const apiKey = process.env.NEYNAR_API_KEY;
  
  // 1. Check API Key
  if (!apiKey) {
    console.error("❌ ERROR: NEYNAR_API_KEY is undefined in Vercel!");
    return NextResponse.json({ error: "Configuration Error: NEYNAR_API_KEY is missing on server." }, { status: 500 });
  }

  try {
    console.log("Sending request to Neynar API...");
    
    // 2. Manual Fetch (No SDK)
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": apiKey,
      },
    });

    console.log("Neynar Status:", response.status);
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Neynar Failed:", responseText);
      return NextResponse.json({ error: "Neynar Error: " + responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({ 
      signerUuid: data.signer_uuid, 
      link: data.signer_approval_url 
    });

  } catch (error: any) {
    console.error("CRITICAL SERVER ERROR:", error);
    return NextResponse.json({ error: "Server Crash: " + error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Safer URL handling
    const { searchParams } = new URL(req.url);
    const signerUuid = searchParams.get('signerUuid');
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!signerUuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    const response = await fetch("https://api.neynar.com/v2/farcaster/signer?signer_uuid=" + signerUuid, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "api_key": apiKey || "",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ status: "pending" }); // Don't crash on pending
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
