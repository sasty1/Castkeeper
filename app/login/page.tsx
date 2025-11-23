"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // We removed useSearchParams because it caused the build error
  // and we didn't actually need it for this bridge page.

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
  // Ensure this matches your Neynar settings exactly
  const redirectUrl = "https://castkeeper-tsf3.vercel.app"; 
  
  // We add mobile=true to force the button view
  const authUrl = "https://app.neynar.com/login?client_id=" + clientId + "&response_type=code&scope=signer_client_write&redirect_uri=" + redirectUrl + "&mobile=true";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect Farcaster</h1>
        <p className="text-gray-400">
          Please confirm the connection to enable scheduling.
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
