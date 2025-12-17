import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const now = new Date();
    let processedCount = 0;

    // Get posts that need to be published
    const { rows } = await sql`
      SELECT * FROM scheduled_posts 
      WHERE status = 'pending' 
      AND scheduled_time <= ${now.toISOString()}
    `;

    for (const post of rows) {
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
        
        // Mark as published
        await sql`
          UPDATE scheduled_posts 
          SET status = 'published', published_at = NOW()
          WHERE id = ${post.id}
        `;
        
        processedCount++;
        console.log(`✅ Published post ${post.id}`);
      } catch (error: any) {
        console.error(`❌ Failed to publish post ${post.id}:`, error);
        
        // Mark as failed
        await sql`
          UPDATE scheduled_posts 
          SET status = 'failed', error = ${error.message}
          WHERE id = ${post.id}
        `;
      }
    }

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
