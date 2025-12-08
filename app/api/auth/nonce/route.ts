import { NextResponse } from "next/server";

export async function GET() {
  // In a real app, save this to a database. 
  // For now, we generate a simple random string to allow the UI to work.
  const nonce = Math.random().toString(36).substring(7);
  return NextResponse.json({ nonce });
}
