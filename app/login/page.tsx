"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
  // Ensure this redirect URI matches your Neynar settings exactly
  const redirectUrl = "https://castkeeper-tsf3.vercel.app"; 
  
  // Use force_mobile=true to ensure the mobile view loads
  const authUrl = `https://app.neynar.com/login?client_id=${clientId}&response_type=code&scope=signer_client_write&redirect_uri=${redirectUrl}&mobile=true`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect Farcaster</h1>
        <p className="text-gray-400">
          Please confirm the connection to enable scheduling.
        </p>
        
        <a 
          href={authUrl}
          className="block w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20"
        >
          Authorise CastKeeper
        </a>
      </div>
    </div>
  );
}
