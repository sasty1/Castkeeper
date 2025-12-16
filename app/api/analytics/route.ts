import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

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

    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const { casts } = await client.fetchCastsForUser({
      fid: parseInt(fid),
      limit: 50,
    });

    const totalCasts = casts.length;
    const totalLikes = casts.reduce((sum, cast) => sum + (cast.reactions?.likes_count || 0), 0);
    const totalRecasts = casts.reduce((sum, cast) => sum + (cast.reactions?.recasts_count || 0), 0);
    const totalReplies = casts.reduce((sum, cast) => sum + (cast.replies?.count || 0), 0);

    const avgLikes = totalCasts > 0 ? Math.round(totalLikes / totalCasts) : 0;
    const avgRecasts = totalCasts > 0 ? Math.round(totalRecasts / totalCasts) : 0;

    const mostEngaged = casts.reduce((best, cast) => {
      const engagement = (cast.reactions?.likes_count || 0) + (cast.reactions?.recasts_count || 0);
      const bestEngagement = (best.reactions?.likes_count || 0) + (best.reactions?.recasts_count || 0);
      return engagement > bestEngagement ? cast : best;
    }, casts[0]);

    return NextResponse.json({
      totalCasts,
      totalLikes,
      totalRecasts,
      totalReplies,
      avgLikes,
      avgRecasts,
      mostEngaged: mostEngaged ? {
        text: mostEngaged.text,
        likes: mostEngaged.reactions?.likes_count || 0,
        recasts: mostEngaged.reactions?.recasts_count || 0,
        url: `https://warpcast.com/${mostEngaged.author.username}/${mostEngaged.hash.slice(0, 10)}`,
      } : null,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
