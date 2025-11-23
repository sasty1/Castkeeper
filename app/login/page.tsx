"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
  const redirectUrl = "https://castkeeper-tsf3.vercel.app"; 
  
  // COMBINATION LOCK: We use all these params to scream "MOBILE" at Neynar
  // 1. mobile=true
  // 2. ui_mode=popup (Often forces the modal view)
  // 3. prompt=login (Forces a fresh check of the device)
  const authUrl = "https://app.neynar.com/login?client_id=" + clientId + "&response_type=code&scope=signer_client_write&redirect_uri=" + redirectUrl + "&mobile=true&ui_mode=popup&prompt=login";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      {/* THIS IS THE FIX: Force Chrome to treat this as a Mobile Page */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect Farcaster</h1>
        <p className="text-gray-400">
          Tap below to authorize.
        </p>
        
        <a 
          href={authUrl}
          className="block w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 no-underline flex items-center justify-center"
        >
          Authorise CastKeeper
        </a>
      </div>
    </div>
  );
}
