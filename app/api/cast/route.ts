import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { castText, signerUuid, channelId, embeds } = body;

    if (!castText || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const castData: any = {
      signerUuid,
      text: castText,
    };

    // Add channel if provided
    if (channelId) {
      castData.channelId = channelId;
    }

    // Add images/embeds if provided
    if (embeds && embeds.length > 0) {
      castData.embeds = embeds;
    }

    const result = await client.publishCast(castData);

    return NextResponse.json({
      success: true,
      cast: result,
    });
  } catch (error: any) {
    console.error('Cast error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish cast' },
      { status: 500 }
    );
  }
}
