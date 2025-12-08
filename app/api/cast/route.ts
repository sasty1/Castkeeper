import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  try {
    const body = await req.json();
    const { castText, signerUuid } = body;

    if (!castText || !signerUuid) {
      return NextResponse.json({ success: false, error: 'Missing text or signer' }, { status: 400 });
    }

    // Direct Fetch to Cast
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api_key": apiKey || "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: castText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.message || "Failed to publish" });
    }

    return NextResponse.json({ success: true, message: 'Cast published' });
  } catch (error: any) {
    console.error('Cast Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to cast' }, { status: 500 });
  }
}
