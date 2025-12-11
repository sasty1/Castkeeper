import { NextResponse } from 'next/server';

// 1. Force Vercel to allow API keys
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Server Error: API Key missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { castText, signerUuid } = body;

    if (!castText || !signerUuid) {
      return NextResponse.json({ success: false, error: 'Missing text or signer UUID' }, { status: 400 });
    }

    // 2. Direct Fetch to Neynar (No SDK)
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: castText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Neynar Cast Error:", data);
      return NextResponse.json({ success: false, error: data.message || "Failed to publish cast" });
    }

    return NextResponse.json({ success: true, message: 'Cast published', hash: data.cast.hash });
  } catch (error: any) {
    console.error('Server Cast Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server failed' }, { status: 500 });
  }
}

