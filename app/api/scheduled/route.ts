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

async function initDB() {
  const pool = getPool();
  try {
    await pool.query(`
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
    `);
  } catch (error) {
    console.error('DB init error:', error);
  } finally {
    await pool.end();
  }
}

export async function GET(request: Request) {
  const pool = getPool();
  try {
    await initDB();
    
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT * FROM scheduled_posts WHERE fid = $1 AND status = $2 ORDER BY scheduled_time ASC',
      [parseInt(fid), 'pending']
    );

    return NextResponse.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json({ posts: [] });
  } finally {
    await pool.end();
  }
}

export async function POST(request: Request) {
  const pool = getPool();
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
    
    await pool.query(
      'INSERT INTO scheduled_posts (id, fid, text, scheduled_time, signer_uuid, channel_id, embeds, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, parseInt(fid), text, scheduledTime, signerUuid, channelId || null, JSON.stringify(embeds || []), 'pending']
    );

    const result = await pool.query('SELECT * FROM scheduled_posts WHERE id = $1', [id]);

    return NextResponse.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

export async function DELETE(request: Request) {
  const pool = getPool();
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM scheduled_posts WHERE id = $1', [postId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
