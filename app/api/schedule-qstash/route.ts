import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, scheduledTime, signerUuid, channelId, embeds } = body;

    if (!text || !scheduledTime || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    // Calculate delay in seconds
    const delaySeconds = Math.floor((scheduledDate.getTime() - now.getTime()) / 1000);

    if (delaySeconds <= 0) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Create the payload for publishing
    const publishPayload = {
      castText: text,
      signerUuid,
      channelId: channelId || null,
      embeds: embeds || [],
    };

    // Schedule with QStash
    const qstashResponse = await fetch('https://qstash.upstash.io/v2/publish/https://castkeeper-tsf3.vercel.app/api/cast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${delaySeconds}s`,
      },
      body: JSON.stringify(publishPayload),
    });

    if (!qstashResponse.ok) {
      const errorText = await qstashResponse.text();
      console.error('QStash error:', errorText);
      throw new Error('Failed to schedule with QStash');
    }

    const qstashData = await qstashResponse.json();

    return NextResponse.json({
      success: true,
      messageId: qstashData.messageId,
      scheduledFor: scheduledTime,
    });
  } catch (error: any) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
