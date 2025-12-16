// app/api/cron/process-scheduled/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const now = new Date();
    let processedCount = 0;
    let errorCount = 0;

    // Get all scheduled post keys
    const keys = await kv.keys('scheduled:*');

    for (const key of keys) {
      try {
        const post = await kv.get(key);
        
        if (!post || post.status !== 'pending') continue;

        const scheduledTime = new Date(post.scheduledTime);
        
        // If it's time to post (with 1 minute buffer)
        if (scheduledTime <= now) {
          console.log(`Publishing post: ${post.id}`);
          
          // Publish the cast
          await client.publishCast({
            signerUuid: post.signerUuid,
            text: post.text,
          });

          // Update status
          post.status = 'published';
          post.publishedAt = now.toISOString();
          await kv.set(key, post);

          // Remove from user's pending list
          await kv.srem(`user:${post.fid}:scheduled`, post.id);

          processedCount++;
          console.log(`✅ Published post ${post.id}`);
        }
      } catch (error) {
        console.error(`Error processing post ${key}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
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
