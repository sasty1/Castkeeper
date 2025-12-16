import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'scheduled-posts.json');

// Get scheduled posts for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    const data = await fs.readFile(DATA_FILE, 'utf8');
    const posts = JSON.parse(data);
    
    const userPosts = posts.filter((p: any) => 
      p.fid === parseInt(fid) && p.status === 'pending'
    );

    return NextResponse.json({ posts: userPosts });
  } catch (error) {
    console.error('Error reading scheduled posts:', error);
    return NextResponse.json({ posts: [] });
  }
}

// Create a scheduled post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, text, scheduledTime, signerUuid, channelId, embeds } = body;

    if (!fid || !text || !scheduledTime || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let posts = [];
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      posts = JSON.parse(data);
    } catch {
      posts = [];
    }

    const newPost = {
      id: Date.now().toString(),
      fid: parseInt(fid),
      text,
      scheduledTime: new Date(scheduledTime).toISOString(),
      signerUuid,
      channelId: channelId || null,
      embeds: embeds || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    posts.push(newPost);
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

// Delete a scheduled post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const data = await fs.readFile(DATA_FILE, 'utf8');
    let posts = JSON.parse(data);
    
    posts = posts.filter((p: any) => p.id !== postId);
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
