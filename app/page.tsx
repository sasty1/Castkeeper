"use client";

import { useState, useEffect } from 'react';
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import sdk from '@farcaster/frame-sdk';
import "@neynar/react/dist/style.css";

const FarcasterIcon = () => <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/></svg>;
const SendIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function CastKeeperApp() {
  const { user } = useNeynarContext(); 
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success'|'error'|'neutral'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => { sdk.actions.ready(); };
    if (sdk && !isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  // --- DIRECT SDK LOGIN (Solution 1) ---
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    // Redirect back to the main app, NOT the login bridge
    const redirectUrl = "https://castkeeper-tsf3.vercel.app"; 
    
    // We point directly to Neynar
    const authUrl = "https://app.neynar.com/login?client_id=" + clientId + "&response_type=code&scope=signer_client_write&redirect_uri=" + redirectUrl;
    
    // Use the SDK to open it. Warpcast will handle the context.
    sdk.actions.openUrl(authUrl);
  };

  useEffect(() => {
    if (user?.fid) {
      const savedDrafts = localStorage.getItem("drafts_" + user.fid); 
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user?.fid]);

  // ... Scheduler Logic ...
  useEffect(() => {
    if (!isScheduled || !targetDate) return;
    const checkTime = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        handleCastDirectly(text); resetSchedule();
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setTimeLeft(days + "d " + hours + "h " + minutes + "m " + seconds + "s");
      }
    };
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [isScheduled, targetDate, text]);

  const saveDraft = () => {
    if (!text) return;
    const newDraft = { id: Date.now(), text, date: new Date().toLocaleString() };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    if (user?.fid) localStorage.setItem("drafts_" + user.fid, JSON.stringify(updatedDrafts));
    setText('');
    setStatus({msg: 'Draft saved!', type: 'success'});
    setTimeout(() => setStatus(null), 3000);
  };

  const startSchedule = () => {
    if (!targetDate) return;
    setIsScheduled(true);
    setStatus({msg: 'Scheduled! Keep tab open.', type: 'neutral'});
  };

  const resetSchedule = () => {
    setIsScheduled(false);
    setTimeLeft('');
    setStatus({msg: 'Schedule cancelled', type: 'neutral'});
  };

  const handleCastDirectly = async (textToCast: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castText: textToCast, signerUuid: user?.signer_uuid }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({msg: 'Published successfully!', type: 'success'});
        if(!isScheduled) setText(''); 
      } else {
        setStatus({msg: data.error, type: 'error'});
      }
    } catch (e) { setStatus({msg: 'Network error', type: 'error'}); } 
    finally { setLoading(false); }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6 relative overflow-hidden font-sans z-50">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/20 blur-[120px] pointer-events-none" />
        <div className="z-10 max-w-md w-full space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-medium text-white tracking-tight">CastKeeper</h1>
            <p className="text-[#888] text-lg leading-relaxed px-4">Sign in to access your scheduler.</p>
          </div>
          <div className="w-full px-2 flex justify-center">
             <button 
               onClick={handleLogin}
               className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <FarcasterIcon />
               Sign In with Farcaster
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6 relative z-10">
      <div className="flex justify-between items-center px-2">
         <h1 className="text-xl font-bold text-white">Hello, @{user.username}</h1>
         <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/20">Sign Out</button>
      </div>
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-xl p-5 space-y-4">
             <textarea className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]" placeholder="What's happening?" value={text} onChange={(e) => setText(e.target.value)} />
             <div className="flex gap-3 pt-2">
                <button onClick={() => handleCastDirectly(text)} disabled={loading || !text} className="flex-1 bg-blue-600 text-white py-3 rounded-xl">
                  {loading ? 'Casting...' : 'Cast Now'}
                </button>
             </div>
          </div>
      </div>
      {status && <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white">{status.msg}</div>}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 overflow-hidden relative">
       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px]" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px]" />
       <NeynarContextProvider settings={{ clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "", defaultTheme: Theme.Dark, eventsCallbacks: { onAuthSuccess: () => {}, onSignout: () => {} } }}>
        <CastKeeperApp />
      </NeynarContextProvider>
    </main>
  );
}
