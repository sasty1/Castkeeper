"use client";

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
console.log("CLIENT ID:", process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID);

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirect = "https://castkeeper-tsf3.vercel.app";

    const raw =
      "https://app.neynar.com/login?client_id=" +
      clientId +
      "&response_type=code&scope=signer_client_write&redirect_uri=" +
      encodeURIComponent(redirect) +
      "&mode=mobile&prompt=consent";

    const finalUrl = "https://warpcast.com/~/add-cast?url=" + encodeURIComponent(raw);

    try {
      sdk.actions.openUrl(finalUrl);
    } catch (err) {
      const message = err && (err + "");
      alert("openUrl error: " + message);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-6">
        <h1 className="text-4xl font-bold text-white">CastKeeper</h1>
        <p className="text-gray-400 mt-2">Sign in to access your scheduler.</p>
        <button
          onClick={handleLogin}
          className="mt-6 w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
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
