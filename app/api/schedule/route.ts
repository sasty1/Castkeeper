import { NextResponse } from 'next/server';
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, signerUuid, targetDate } = body;

    if (!text || !signerUuid || !targetDate) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Calculate how many seconds to wait
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const delaySeconds = Math.floor((target - now) / 1000);

    if (delaySeconds < 1) {
      return NextResponse.json({ error: 'Time must be in the future' }, { status: 400 });
    }

    console.log("Scheduling for " + delaySeconds + " seconds via QStash");

    // Send to QStash. 
    // QStash will wake up your /api/cast API when the time comes.
    const result = await qstash.publishJSON({
      url: "https://castkeeper-tsf3.vercel.app/api/cast",
      body: {
        castText: text,
        signerUuid: signerUuid
      },
      delay: delaySeconds,
    });

    return NextResponse.json({ success: true, id: result.messageId });

  } catch (error: any) {
    console.error("Scheduler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
