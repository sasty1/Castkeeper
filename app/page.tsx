"use client";

import { useState, useEffect, useRef } from 'react';
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import sdk from '@farcaster/frame-sdk';
import "@neynar/react/dist/style.css";

// --- ICONS ---
const FarcasterIcon = () => <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/></svg>;
const SendIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const KeyIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.5 15.5a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077l4.774-4.566A6 6 0 0115 7zm0 2a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const LinkIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

function CastKeeperApp() {
  const { user: neynarUser } = useNeynarContext(); 
  const [frameUser, setFrameUser] = useState<any>(null);
  
  // Combine users: Use Frame user if available, otherwise Neynar user
  const user = frameUser || neynarUser;

  const [text, setText] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success'|'error'|'neutral'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const timerRef = useRef<any>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  
  // STATE FOR MANUAL LINK
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => { 
      try {
        // 1. Try to get context from Frame SDK (Auto-Login)
        const context = await sdk.context;
        if (context?.user) {
          console.log("Frame User Detected:", context.user);
          setFrameUser({
            fid: context.user.fid,
            username: context.user.username,
            pfp: context.user.pfpUrl
          });
        }
        sdk.actions.ready(); 
      } catch(e) {
        console.error("SDK Error:", e);
      }
    };
    if (!isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  // Load local settings once we have a user
  useEffect(() => {
    if (user?.fid) {
      const savedSigner = localStorage.getItem("signer_" + user.fid);
      if (savedSigner) setSignerUuid(savedSigner);

      const savedDrafts = localStorage.getItem("drafts_" + user.fid); 
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user]);

  // --- LOGIN LOGIC (Fallback for Web) ---
  const handleWebLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirectUri = "https://castkeeper-tsf3.vercel.app"; 
    const url = "https://app.neynar.com/login?client_id=" + clientId + "&response_type=code&scope=signer_client_write&redirect_uri=" + encodeURIComponent(redirectUri) + "&mode=mobile&prompt=consent";
    // Use standard window.location to fix "referrer" error
    window.location.href = url;
  };

  // --- SIGNER REQUEST LOGIC ---
  const requestSigner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || data.error) throw new Error(data.error || 'Signer Setup Failed');
      
      setApprovalUrl(data.link);
      
      // Try auto-open
      try { sdk.actions.openUrl(data.link); } catch(e) { window.open(data.link, '_blank'); }
      
      const checkStatus = setInterval(async () => {
        try {
            const poll = await fetch("/api/connect?signerUuid=" + data.signerUuid);
            const statusData = await poll.json();
            if (statusData.status === 'approved') {
              clearInterval(checkStatus);
              setSignerUuid(data.signerUuid);
              if (user?.fid) localStorage.setItem("signer_" + user.fid, data.signerUuid);
              setStatus({msg: 'Posting enabled!', type: 'success'});
              setLoading(false);
              setApprovalUrl(null); 
            }
        } catch(ignored) {}
      }, 2000);
      
    } catch (e: any) {
      setStatus({msg: e.message, type: 'error'});
      setLoading(false);
    }
  };

  // ... Scheduler Timer ...
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
    timerRef.current = setInterval(checkTime, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    if (!signerUuid) {
      setStatus({msg: 'Please enable posting first', type: 'error'});
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
        setStatus({msg: 'Published successfully!', type: 'success'});
        if(!isScheduled) setText(''); 
      } else {
        setStatus({msg: data.error, type: 'error'});
      }
    } catch (e) { setStatus({msg: 'Network error', type: 'error'}); } 
    finally { setLoading(false); }
  };

  // --- LOGIN UI ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6 relative overflow-hidden font-sans z-50">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/20 blur-[120px] pointer-events-none" />
        <div className="z-10 max-w-md w-full space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-medium text-white tracking-tight">CastKeeper</h1>
            <p className="text-[#888] text-lg leading-relaxed px-4">
              The pro scheduler for Farcaster.<br />
              <span className="text-[#555] text-sm mt-2 block">Sign in to access your dashboard.</span>
            </p>
          </div>
          <div className="w-full px-2 flex justify-center">
             <button 
               onClick={handleWebLogin}
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

  // --- DASHBOARD UI ---
  return (
    <div className="w-full max-w-lg space-y-6 relative z-10">
      <div className="flex justify-between items-center px-2">
         <h1 className="text-xl font-bold text-white">Hello, @{user.username}</h1>
         <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/20">Sign Out</button>
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
            
            <div className="flex gap-3 pt-2">
              {!signerUuid ? (
                <div className="flex-1 flex flex-col gap-2">
                  <button onClick={requestSigner} disabled={loading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold bg-yellow-600 hover:bg-yellow-500 text-white transition-all">
                    {loading ? 'Waiting...' : <><KeyIcon /> Enable Posting</>}
                  </button>
                  {loading && approvalUrl && (
                    <button 
                      onClick={() => { try { sdk.actions.openUrl(approvalUrl); } catch(e) { window.open(approvalUrl, '_blank'); } }} 
                      className="w-full text-xs text-yellow-400 hover:text-yellow-300 underline flex items-center justify-center"
                    >
                      <LinkIcon /> Tap here if approval screen didn't open
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => handleCastDirectly(text)} disabled={loading || !text || isScheduled} className={"flex-1 flex items-center justify-center py-3 rounded-xl font-bold transition-all duration-200 " + (loading || !text || isScheduled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]')}>
                  {loading ? 'Casting...' : <><SendIcon /> Cast Now</>}
                </button>
              )}
              
              <button onClick={saveDraft} disabled={!text} className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-3 rounded-xl transition-colors"><SaveIcon /></button>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              {!isScheduled ? (
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><ClockIcon /></div>
                    <input type="datetime-local" className="w-full bg-black/50 border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-purple-500 transition-colors" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  </div>
                  <button onClick={startSchedule} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-700 transition-colors">Schedule</button>
                </div>
              ) : (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex justify-between items-center animate-pulse">
                  <div className="flex items-center text-purple-200 font-mono"><ClockIcon /> <span className="font-bold tracking-wider">{timeLeft}</span></div>
                  <button onClick={resetSchedule} className="text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/20">Cancel</button>
                </div>
              )}
            </div>
          </div>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">Saved Drafts</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {drafts.map((draft: any) => (
              <div key={draft.id} onClick={() => setText(draft.text)} className="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all">
                <div className="overflow-hidden"><p className="text-gray-300 text-sm truncate">{draft.text}</p><p className="text-gray-600 text-xs mt-1">{draft.date}</p></div>
                <button onClick={(e) => { 
                  e.stopPropagation(); 
                  const newDrafts = drafts.filter((d: any) => d.id !== draft.id); 
                  setDrafts(newDrafts); 
                  if (user?.fid) localStorage.setItem("drafts_" + user.fid, JSON.stringify(newDrafts)); 
                }} className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div className={"absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full backdrop-blur-md text-sm border shadow-xl z-50 flex items-center whitespace-nowrap animate-fade-in-down " + (status.type === 'success' ? 'bg-green-900/80 border-green-500 text-green-100' : status.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' : 'bg-gray-800/90 border-gray-600 text-white')}>
          {status.msg}
        </div>
      )}
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
