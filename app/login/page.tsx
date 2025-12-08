"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => { 
    setIsMounted(true);
    
    // Check if we got a code back from Neynar
    const code = searchParams.get('code');
    if (code) {
      handleCallback(code);
    }
  }, [searchParams]);

  const handleCallback = async (code: string) => {
    try {
      setStatus("Processing authentication...");
      
      // Exchange code for signer (you'll need to implement this API route)
      const res = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Save user data to localStorage
        if (data.fid) {
          localStorage.setItem('fid', data.fid.toString());
          localStorage.setItem('signer_' + data.fid, data.signer_uuid);
        }
        
        setStatus("Success! Redirecting...");
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setStatus("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error('Callback error:', error);
      setStatus("Error processing authentication.");
    }
  };

  if (!isMounted) return null;

  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
  const redirectUrl = typeof window !== 'undefined' 
    ? window.location.origin + '/login'
    : "https://castkeeper-tsf3.vercel.app/login"; 
  
  const authUrl = `https://app.neynar.com/login?client_id=${clientId}&response_type=code&scope=signer_client_write&redirect_uri=${encodeURIComponent(redirectUrl)}&mobile=true&ui_mode=popup&prompt=login`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect Farcaster</h1>
        
        {status ? (
          <p className="text-purple-400 font-semibold">{status}</p>
        ) : (
          <>
            <p className="text-gray-400">
              Tap below to authorize.
            </p>
            
            <a 
              href={authUrl}
              className="block w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 no-underline flex items-center justify-center"
            >
              Authorise CastKeeper
            </a>
          </>
        )}
      </div>
    </div>
  );
}
