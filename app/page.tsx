"use client";

import { useState, useEffect, useRef } from 'react';
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
// 1. Using the specific package you requested
import { sdk } from '@farcaster/miniapp-sdk';
import "@neynar/react/dist/style.css";

// --- ICONS ---
const FarcasterIcon = () => <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/></svg>;
const SendIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function CastKeeperApp() {
  const { user: neynarUser } = useNeynarContext(); 
  const [frameUser, setFrameUser] = useState<any>(null);
  const user = frameUser || neynarUser;

  const [text, setText] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success'|'error'|'neutral'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const timerRef = useRef<any>(null);
  
  // SIGNER STATE
  const [signerUuid, setSignerUuid] = useState<string | null>(null);

  // --- 2. YOUR EXACT REQUESTED READY CALL ---
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
    
    // Also try to get context if available
    const loadContext = async () => {
       try {
         const context = await sdk.context;
         if (context?.user) {
           setFrameUser({ fid: context.user.fid, username: context.user.username, pfp: context.user.pfpUrl });
         }
       } catch(e) {}
    };
    loadContext();
  }, []);

  // --- 3. FIXED SIGN-IN HANDLER ---
  const handleSignIn = async () => {
    try {
      setLoading(true);
      setStatus({ msg: 'Requesting signature...', type: 'neutral' });
      console.log('Requesting signature...');
      
      // Step 1: Get a nonce from the server
      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) {
        throw new Error('Failed to get nonce');
      }
      const { nonce } = await nonceRes.json();
      
      // Step 2: Request sign-in with the nonce
      const result = await sdk.actions.signIn({ nonce });
      
      if (result) {
        setStatus({ msg: 'Verifying...', type: 'neutral' });
        console.log('Sign-in result:', result);
        
        // Step 3: Send to your backend to verify
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: result.message,
            signature: result.signature,
            domain: result.domain || window.location.host,
            nonce: result.nonce || nonce,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Verification success:', data);
          
          // Save user data
          if (data.fid) {
            setFrameUser({ 
              fid: data.fid, 
              username: result.username || `user${data.fid}`,
              pfp: result.pfpUrl 
            });
            
            // Save to localStorage
            localStorage.setItem('fid', data.fid.toString());
            localStorage.setItem('auth_token', data.token);
          }
          
          setStatus({ msg: 'Signed in successfully!', type: 'success' });
          
          // Clear status after 2 seconds
          setTimeout(() => setStatus(null), 2000);
        } else {
          const errorData = await res.json();
          console.error('Verification failed:', errorData);
          setStatus({ msg: 'Verification failed: ' + (errorData.error || 'Unknown error'), type: 'error' });
        }
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // This catch PREVENTS the mini app from closing
      if (err?.message?.includes('cancelled') || err?.message?.includes('rejected')) {
        setStatus({ msg: 'You cancelled sign-in', type: 'error' });
      } else {
        setStatus({ msg: 'Sign-in failed: ' + (err.message || 'Unknown error'), type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- LOAD SAVED DATA ---
  useEffect(() => {
    if (user?.fid) {
      const savedSigner = localStorage.getItem("signer_" + user.fid);
      if (savedSigner) setSignerUuid(savedSigner);
      const savedDrafts = localStorage.getItem("drafts_" + user.fid); 
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user]);

  // --- POSTING LOGIC (Neynar) ---
  const handleCastDirectly = async (textToCast: string, fromSchedule = false) => {
    // If we don't have a signer yet, we prompt the native sign-in.
    // Note: Native Sign In gives Identity. Neynar needs Write Access.
    // If this app is for scheduling, we eventually need a Write Key.
    if (!signerUuid) {
      handleSignIn(); // Try native auth first
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castText: textToCast, signerUuid: signerUuid }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({msg: 'Published!', type: 'success'});
        if (fromSchedule) { resetSchedule(true); setText(''); } else { setText(''); }
      } else {
        setStatus({msg: data.error, type: 'error'});
        if (fromSchedule) setIsScheduled(false);
      }
    } catch (e) { 
        setStatus({msg: 'Network error', type: 'error'}); 
        if (fromSchedule) setIsScheduled(false);
    } 
    finally { setLoading(false); }
  };

  const resetSchedule = (keepMessage = false) => {
    setIsScheduled(false);
    setTimeLeft('');
    if (!keepMessage) setStatus({msg: 'Schedule cancelled', type: 'neutral'});
  };
  
  useEffect(() => {
    if (!isScheduled || !targetDate) return;
    const checkTime = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(timerRef.current);
        handleCastDirectly(text, true); 
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setTimeLeft(days + "d " + hours + "h " + minutes + "m " + seconds + "s");
      }
    };
    timerRef.current = setInterval(checkTime, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isScheduled, targetDate, text]);

  // --- UI RENDER ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6 text-white">
        <h1 className="text-3xl font-bold mb-4">CastKeeper</h1>
        <p className="text-gray-400 mb-6">Schedule your Farcaster posts</p>
        
        {/* FOR LOCAL TESTING: Use Neynar login page */}
        <a 
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto no-underline"
        >
          <FarcasterIcon /> Sign in with Farcaster
        </a>
        
        <p className="text-xs text-gray-500 mt-4">
          For Frame: Use handleSignIn • For Web: Use /login
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6 relative z-10">
      <div className="flex justify-between items-center px-2">
         <h1 className="text-xl font-bold text-white">@{user.username}</h1>
         <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded">Sign Out</button>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-xl p-5 space-y-4">
            <textarea 
              className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]" 
              placeholder="What's happening?" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              disabled={isScheduled || loading}
            />
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                  {!signerUuid ? (
                    // REPLACED THE OLD "OPEN URL" BUTTON WITH NATIVE SIGN IN
                    <button onClick={handleSignIn} disabled={loading} className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-yellow-600 text-white animate-pulse">
                        {loading ? 'Signing in...' : 'Connect Farcaster'}
                    </button>
                  ) : (
                    <button onClick={() => handleCastDirectly(text)} disabled={loading || !text || isScheduled} className={"flex-1 flex items-center justify-center py-3 rounded-xl font-bold " + (loading || !text || isScheduled ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600') + " text-white shadow-lg"}>
                      {loading ? 'Casting...' : 'Cast Now'}
                    </button>
                  )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              {!isScheduled ? (
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><ClockIcon /></div>
                    <input type="datetime-local" className="w-full bg-black/50 border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-purple-500 transition-colors" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  </div>
                  <button onClick={() => { if(!signerUuid) { setStatus({msg: 'Connect First!', type: 'error'}); return; } setIsScheduled(true); setStatus({msg:'Scheduled!', type:'neutral'}); }} className="px-4 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold border border-gray-700">Schedule</button>
                </div>
              ) : (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex justify-between items-center animate-pulse">
                  <div className="flex items-center text-purple-200 font-mono"><ClockIcon /> <span className="font-bold tracking-wider">{timeLeft}</span></div>
                  <button onClick={() => resetSchedule()} className="text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20">Cancel</button>
                </div>
              )}
            </div>
          </div>
      </div>
      
      {status && (
        <div className={"text-center p-2 rounded fixed bottom-4 left-4 right-4 z-50 shadow-xl backdrop-blur-md " + (status.type === 'error' ? 'bg-red-900/90 text-white' : status.type === 'success' ? 'bg-green-900/90 text-white' : 'bg-gray-800/90 text-white')}>
          {status.msg}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
       <NeynarContextProvider settings={{ clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "", defaultTheme: Theme.Dark, eventsCallbacks: { onAuthSuccess: () => {}, onSignout: () => {} } }}>
        <CastKeeperApp />
      </NeynarContextProvider>
    </main>
  );
}
