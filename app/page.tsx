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
const RefreshIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

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
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  
  // SIGNER STATE
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [pendingSignerUuid, setPendingSignerUuid] = useState<string | null>(null);

  // --- 1. INITIAL LOAD & AUTH ---
  useEffect(() => {
    const load = async () => { 
      try {
        const context = await sdk.context;
        if (context?.user) {
          console.log("Frame User Detected:", context.user);
          setFrameUser({
            fid: context.user.fid,
            username: context.user.username,
            pfp: context.user.pfpUrl
          });
        }
        // Tell Farcaster the Frame is ready to render
        sdk.actions.ready(); 
      } catch(e) {
        console.error("SDK Error:", e);
      }
    };
    if (!isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  // --- 2. RESTORE DATA ---
  useEffect(() => {
    if (user?.fid) {
      const savedSigner = localStorage.getItem("signer_" + user.fid);
      if (savedSigner) setSignerUuid(savedSigner);

      const savedDrafts = localStorage.getItem("drafts_" + user.fid); 
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user]);

  // --- WEB FALLBACK LOGIN ---
  const handleWebLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirectUri = "https://castkeeper-tsf3.vercel.app"; 
    window.location.href = "https://app.neynar.com/login?client_id=" + clientId + "&response_type=code&scope=signer_client_write&redirect_uri=" + encodeURIComponent(redirectUri) + "&mode=mobile&prompt=consent";
  };

  // --- 3. ROBUST SIGNER REQUEST ---
  const requestSigner = async () => {
    setLoading(true);
    setStatus({msg: 'Creating secure channel...', type: 'neutral'});
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || data.error) throw new Error(data.error || 'Signer Setup Failed');
      
      setApprovalUrl(data.link);
      setPendingSignerUuid(data.signerUuid); // Save this so we can check it later
      
      // Try to open the approval link using the SDK (Best for Mobile)
      try { 
        await sdk.actions.openUrl(data.link); 
      } catch(e) { 
        window.open(data.link, '_blank'); 
      }
      
      setStatus({msg: 'Please approve in the new window', type: 'neutral'});
      
      // Start polling
      checkSignerStatus(data.signerUuid, true);
      
    } catch (e: any) {
      setStatus({msg: e.message, type: 'error'});
      setLoading(false);
    }
  };

  // --- 4. MANUAL STATUS CHECKER ---
  // This is the fix: Allows user to manually click "I Approved It" if polling fails
  const checkSignerStatus = async (uuidToCheck: string, isAutoPoll = false) => {
    try {
        const poll = await fetch("/api/connect?signerUuid=" + uuidToCheck);
        const statusData = await poll.json();
        
        if (statusData.status === 'approved') {
          setSignerUuid(uuidToCheck);
          if (user?.fid) localStorage.setItem("signer_" + user.fid, uuidToCheck);
          
          setStatus({msg: 'Posting enabled!', type: 'success'});
          setLoading(false);
          setApprovalUrl(null); 
          setPendingSignerUuid(null);
          return true;
        } else {
           if (!isAutoPoll) setStatus({msg: 'Not approved yet. Try again.', type: 'error'});
           return false;
        }
    } catch(e) {
        if (!isAutoPoll) setStatus({msg: 'Check failed. Internet issue?', type: 'error'});
        return false;
    }
  };

  // --- SCHEDULER LOGIC ---
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
    // BLOCKER: Cannot schedule without signer
    if (!signerUuid) {
      setStatus({msg: 'Tap "Enable Posting" first!', type: 'error'});
      return;
    }
    if (!targetDate) return;
    setIsScheduled(true);
    setStatus({msg: 'Scheduled! Keep tab open.', type: 'neutral'});
  };

  const resetSchedule = (keepMessage = false) => {
    setIsScheduled(false);
    setTimeLeft('');
    if (!keepMessage) setStatus({msg: 'Schedule cancelled', type: 'neutral'});
  };

  const handleCastDirectly = async (textToCast: string, fromSchedule = false) => {
    if (!signerUuid) {
      setStatus({msg: 'Please enable posting first', type: 'error'});
      if (fromSchedule) resetSchedule(true);
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
        if (fromSchedule) {
            resetSchedule(true);
            setText('');
        } else {
            setText(''); 
        }
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

  // --- UI RENDER ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6 relative overflow-hidden font-sans z-50">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/20 blur-[120px] pointer-events-none" />
        <div className="z-10 max-w-md w-full space-y-10">
          <div className="space-y-4">
             <h1 className="text-5xl font-medium text-white tracking-tight">CastKeeper</h1>
             <p className="text-gray-500 text-sm">To access your dashboard, open this inside Farcaster.</p>
             <button onClick={handleWebLogin} className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
               <FarcasterIcon /> Web Login (Fallback)
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
            <textarea 
              className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]" 
              placeholder="What's happening?" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              disabled={isScheduled || loading} 
            />
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                  {/* SIGNER / POST BUTTON */}
                  {!signerUuid ? (
                    <button onClick={requestSigner} disabled={loading} className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-yellow-600 hover:bg-yellow-500 text-white transition-all animate-pulse shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                        {loading ? 'Waiting...' : <><KeyIcon /> Enable Posting (Required)</>}
                    </button>
                  ) : (
                    <button onClick={() => handleCastDirectly(text)} disabled={loading || !text || isScheduled} className={"flex-1 flex items-center justify-center py-3 rounded-xl font-bold transition-all duration-200 " + (loading || !text || isScheduled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg')}>
                      {loading ? 'Casting...' : <><SendIcon /> Cast Now</>}
                    </button>
                  )}
                  <button onClick={saveDraft} disabled={!text} className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-3 rounded-xl"><SaveIcon /></button>
              </div>

              {/* MANUAL CHECK / FALLBACK LINK */}
              {approvalUrl && !signerUuid && (
                  <div className="flex gap-2">
                      <button onClick={() => sdk.actions.openUrl(approvalUrl)} className="flex-1 text-xs bg-yellow-900/30 text-yellow-200 border border-yellow-700/50 py-2 rounded-lg flex items-center justify-center gap-2">
                         <RefreshIcon /> Re-open Approval
                      </button>
                      <button onClick={() => pendingSignerUuid && checkSignerStatus(pendingSignerUuid)} className="flex-1 text-xs bg-green-900/30 text-green-200 border border-green-700/50 py-2 rounded-lg font-bold">
                         I've Approved It!
                      </button>
                  </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              {!isScheduled ? (
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><ClockIcon /></div>
                    <input type="datetime-local" className="w-full bg-black/50 border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-purple-500 transition-colors" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  </div>
                  <button onClick={startSchedule} className={"px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors " + (!signerUuid ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-800" : "bg-gray-800 hover:bg-gray-700 text-white border-gray-700")}>
                    Schedule
                  </button>
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
      
      {/* Drafts List */}
      {drafts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">Saved Drafts</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {drafts.map((draft: any) => (
              <div key={draft.id} onClick={() => setText(draft.text)} className="flex justify-between items-center p-4 bg-white/5 rounded-xl cursor-pointer">
                <p className="text-gray-300 text-sm truncate">{draft.text}</p>
                <button onClick={(e) => { e.stopPropagation(); const newDrafts = drafts.filter((d: any) => d.id !== draft.id); setDrafts(newDrafts); localStorage.setItem("drafts_" + user.fid, JSON.stringify(newDrafts)); }} className="text-gray-600 hover:text-red-400 p-2"><TrashIcon /></button>
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
