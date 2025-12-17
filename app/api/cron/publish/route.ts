import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

function getPool() {
  return new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const pool = getPool();
    const now = new Date();
    let processedCount = 0;

    const result = await pool.query(
      'SELECT * FROM scheduled_posts WHERE status = $1 AND scheduled_time <= $2',
      ['pending', now.toISOString()]
    );

    for (const post of result.rows) {
      try {
        console.log(`Publishing post: ${post.id}`);
        
        const castData: any = {
          signerUuid: post.signer_uuid,
          text: post.text,
        };

        if (post.channel_id) {
          castData.channelId = post.channel_id;
        }

        if (post.embeds && post.embeds.length > 0) {
          castData.embeds = post.embeds;
        }

        await client.publishCast(castData);
        
        await pool.query(
          'UPDATE scheduled_posts SET status = $1, published_at = NOW() WHERE id = $2',
          ['published', post.id]
        );
        
        processedCount++;
        console.log(`✅ Published post ${post.id}`);
      } catch (error: any) {
        console.error(`❌ Failed to publish post ${post.id}:`, error);
        
        await pool.query(
          'UPDATE scheduled_posts SET status = $1, error = $2 WHERE id = $3',
          ['failed', error.message, post.id]
        );
      }
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
