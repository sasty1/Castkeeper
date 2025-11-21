import { NextResponse } from 'next/server';

interface RequestBody {
  castText: string;
}

interface NeynarResponse {
  cast: {
    hash: string;
    author: {
      fid: number;
      username: string;
    };
  };
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { castText } = body;

    if (!castText || typeof castText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing "castText" in request body.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUuid = process.env.NEYNAR_SIGNER_UUID;
    const fid = process.env.NEYNAR_FID;

    if (!apiKey || !signerUuid || !fid) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing environment variables.' },
        { status: 500 }
      );
    }

    const neynarEndpoint = 'https://api.neynar.com/v2/farcaster/cast';
    
    const neynarBody = {
      signer_uuid: signerUuid,
      text: castText,
      fid: parseInt(fid, 10),
    };

    const neynarResponse = await fetch(neynarEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
      body: JSON.stringify(neynarBody),
    });

    const responseData: NeynarResponse = await neynarResponse.json();

    if (!neynarResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.message || `Neynar API responded with status ${neynarResponse.status}` 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cast published successfully.',
        castHash: responseData.cast.hash,
      },
      { status: 200 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      },
      { status: 500 }
    );
  }
}
