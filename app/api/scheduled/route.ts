// app/api/scheduled/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, text, scheduledTime, signerUuid } = body;

    if (!fid || !text || !scheduledTime || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledPost = {
      id: Date.now().toString(),
      fid,
      text,
      scheduledTime: new Date(scheduledTime).toISOString(),
      signerUuid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store in KV with unique key
    await kv.set(`scheduled:${scheduledPost.id}`, scheduledPost);
    
    // Add to user's scheduled posts list
    await kv.sadd(`user:${fid}:scheduled`, scheduledPost.id);

    return NextResponse.json({ 
      success: true, 
      post: scheduledPost 
    });
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Get all scheduled post IDs for user
    const postIds = await kv.smembers(`user:${fid}:scheduled`);
    
    // Fetch all scheduled posts
    const posts = await Promise.all(
      postIds.map(async (id) => {
        return await kv.get(`scheduled:${id}`);
      })
    );

    // Filter out null/completed posts and sort by time
    const pendingPosts = posts
      .filter(post => post && post.status === 'pending')
      .sort((a, b) => 
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );

    return NextResponse.json({ posts: pendingPosts });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const fid = searchParams.get('fid');

    if (!postId || !fid) {
      return NextResponse.json(
        { error: 'Post ID and FID are required' },
        { status: 400 }
      );
    }

    await kv.del(`scheduled:${postId}`);
    await kv.srem(`user:${fid}:scheduled`, postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
}
