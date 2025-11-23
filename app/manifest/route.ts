import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    version: "1",
    name: "CastKeeper",
    icon: "https://castkeeper-tsf3.vercel.app/icon.png",
    homepage: "https://castkeeper-tsf3.vercel.app",
    requested_permissions: ["signer"],
    frames: [
      {
        path: "/",
        name: "Main"
      }
    ]
  });
}
