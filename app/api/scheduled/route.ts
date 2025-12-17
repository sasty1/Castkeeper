import { NextResponse } from 'next/server';
import postgres from 'postgres';

function getSql() {
  return postgres(process.env.PRISMA_DATABASE_URL!, {
    ssl: 'require',
  });
}

async function initDB() {
  const sql = getSql();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id TEXT PRIMARY KEY,
        fid INTEGER NOT NULL,
        text TEXT NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        signer_uuid TEXT NOT NULL,
        channel_id TEXT,
        embeds JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error('DB init error:', error);
  } finally {
    await sql.end();
  }
}

export async function GET(request: Request) {
  const sql = getSql();
  try {
    await initDB();
    
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM scheduled_posts 
      WHERE fid = ${parseInt(fid)} AND status = 'pending'
      ORDER BY scheduled_time ASC
    `;

    return NextResponse.json({ posts: rows });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json({ posts: [] });
  } finally {
    await sql.end();
  }
}

export async function POST(request: Request) {
  const sql = getSql();
  try {
    await initDB();
    
    const body = await request.json();
    const { fid, text, scheduledTime, signerUuid, channelId, embeds } = body;

    if (!fid || !text || !scheduledTime || !signerUuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    
    await sql`
      INSERT INTO scheduled_posts 
      (id, fid, text, scheduled_time, signer_uuid, channel_id, embeds, status)
      VALUES (
        ${id}, 
        ${parseInt(fid)}, 
        ${text}, 
        ${scheduledTime}, 
        ${signerUuid},
        ${channelId || null},
        ${JSON.stringify(embeds || [])},
        'pending'
      )
    `;

    const rows = await sql`
      SELECT * FROM scheduled_posts WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, post: rows[0] });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export async function DELETE(request: Request) {
  const sql = getSql();
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await sql`DELETE FROM scheduled_posts WHERE id = ${postId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
