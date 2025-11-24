import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Configuration Error: NEYNAR_API_KEY is missing on Vercel." }, { status: 500 });
    }

    // 1. Request Signer via raw HTTP (No SDK to avoid library errors)
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": apiKey,
      },
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({ error: "Neynar API Error: " + responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({ 
      signerUuid: data.signer_uuid, 
      link: data.signer_approval_url 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Server Crash: " + error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
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

    if (!response.ok) return NextResponse.json({ status: "pending" });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
