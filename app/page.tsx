"use client";

import { useState, useEffect } from "react";
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import sdk from "@farcaster/frame-sdk";
import "@neynar/react/dist/style.css";

const FarcasterIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
    <path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/>
  </svg>
);

function CastKeeperApp() {
  const { user } = useNeynarContext();

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirectUri = "https://castkeeper-tsf3.vercel.app";

    let loginUrl = "https://app.neynar.com/login";
    loginUrl += "?client_id=" + clientId;
    loginUrl += "&response_type=code";
    loginUrl += "&scope=signer_client_write";
    loginUrl += "&redirect_uri=" + encodeURIComponent(redirectUri);
    loginUrl += "&mode=mobile";
    loginUrl += "&prompt=consent";

    const wrapped = "https://warpcast.com/~/add-cast?url=" + encodeURIComponent(loginUrl);

    alert("DEBUG URL:\n\n" + wrapped);

    try {
      sdk.actions.openUrl(wrapped);
    } catch (err) {
      const message = err && (err + "");
      alert("openUrl error: " + message);
    }
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
