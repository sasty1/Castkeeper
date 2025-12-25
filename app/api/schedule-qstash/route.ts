import { NextResponse } from 'next/server';
import { Pool } from 'pg';

function getPool() {
  return new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export async function POST(request: Request) {
  const pool = getPool();
  
  try {
    const body = await request.json();
    const { text, scheduledTime, signerUuid, channelId, embeds, userFid } = body;

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

    // Save to database first
    const result = await pool.query(
      `INSERT INTO scheduled_posts 
       (user_fid, text, signer_uuid, channel_id, embeds, scheduled_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        userFid || 0,
        text,
        signerUuid,
        channelId || null,
        embeds ? JSON.stringify(embeds) : null,
        scheduledDate.toISOString(),
        'pending'
      ]
    );

    const postId = result.rows[0].id;

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
      
      // Mark as failed in database
      await pool.query(
        'UPDATE scheduled_posts SET status = $1, error = $2 WHERE id = $3',
        ['failed', 'QStash scheduling failed', postId]
      );
      
      throw new Error('Failed to schedule with QStash');
    }

    const qstashData = await qstashResponse.json();

    return NextResponse.json({
      success: true,
      messageId: qstashData.messageId,
      postId: postId,
      scheduledFor: scheduledTime,
    });
  } catch (error: any) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to schedule post' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
