"use client";

import { useState, useEffect, useRef } from "react";
import {
  NeynarContextProvider,
  Theme,
  useNeynarContext,
} from "@neynar/react";
import sdk from "@farcaster/frame-sdk";
import "@neynar/react/dist/style.css";

// ICONS
const SendIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FarcasterIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 
8 3.589 8 8-3.589 8-8 8z" />
    <path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z" />
  </svg>
);

function CastKeeperApp() {
  const { user } = useNeynarContext();
  const [text, setText] = useState("");

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirectUri = "https://castkeeper-tsf3.vercel.app";

    const loginUrl =
      "https://app.neynar.com/login" +
       +
      "&response_type=code" +
      "&scope=signer_client_write" +
       +
      "&mode=mobile" +
      "&prompt=consent";

    const wrapped = `https://warpcast.com/~/add-cast?url=${encodeURIComponent(loginUrl)}`;

    sdk.actions.openUrl(wrapped);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6">
        <h1 className="text-5xl font-medium text-white">CastKeeper</h1>
        <p className="text-[#888] text-lg px-4">Sign in to access your scheduler.</p>

        <button
          onClick={handleLogin}
          className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2"
        >
          <FarcasterIcon />
          Sign In with Farcaster
        </button>
      </div>
    );
  }

  return (
    <div className="text-white p-6">
      Logged in as @{user.username}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <NeynarContextProvider
        settings={{
          clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
          defaultTheme: Theme.Dark,
        }}
      >
        <CastKeeperApp />
      </NeynarContextProvider>
    </main>
  );
}
