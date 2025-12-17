import { NextResponse } from 'next/server';
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Accept 'delaySeconds' directly from the frontend
    const { text, signerUuid, delaySeconds } = body;

    if (!text || !signerUuid || delaySeconds === undefined) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    console.log("Scheduling for " + delaySeconds + " seconds via QStash");

    // Enforce a minimum delay of 1 second
    const finalDelay = Math.max(1, delaySeconds);

    const result = await qstash.publishJSON({
      url: "https://castkeeper-tsf3.vercel.app/api/cast",
      body: {
        castText: text,
        signerUuid: signerUuid
      },
      delay: finalDelay,
    });

    return NextResponse.json({ success: true, id: result.messageId });

  } catch (error: any) {
    console.error("Scheduler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
