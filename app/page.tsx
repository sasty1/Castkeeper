"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [user, setUser] = useState<any>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success'|'error'|'neutral'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const timerRef = useRef<any>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  // --- 1. INITIALIZE SDK ---
  useEffect(() => {
    const load = async () => { 
      sdk.actions.ready(); 
      const context = await sdk.context;
      if (context?.user) {
        setUser(context.user);
        const savedSigner = localStorage.getItem("signer_" + context.user.fid);
        if (savedSigner) setSignerUuid(savedSigner);
      }
    };
    if (sdk && !isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  // --- 2. NATIVE LOGIN ---
  const handleNativeLogin = async () => {
    setLoading(true);
    try {
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();
      const result = await sdk.actions.signIn({ nonce });
      const u = (result as any).user;
      setUser(u);
      const savedSigner = localStorage.getItem("signer_" + u.fid);
      if (savedSigner) setSignerUuid(savedSigner);
      setStatus({msg: 'Signed in successfully!', type: 'success'});
    } catch (e) { 
      setStatus({msg: 'Login failed. Try again.', type: 'error'}); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 3. REQUEST POSTING PERMISSION ---
  const requestSigner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || data.error) throw new Error(data.error || 'Signer Setup Failed');
      
      let deepLink = data.link;
      if (deepLink.startsWith("https://warpcast.com/")) {
        deepLink = deepLink.replace("https://warpcast.com/", "warpcast://");
      }

      setApprovalUrl(deepLink);
      sdk.actions.openUrl(deepLink);
      
      const checkStatus = setInterval(async () => {
        try {
            const poll = await fetch("/api/connect?signerUuid=" + data.signerUuid);
            const statusData = await poll.json();
            if (statusData.status === 'approved') {
              clearInterval(checkStatus);
              setSignerUuid(data.signerUuid);
              localStorage.setItem("signer_" + user.fid, data.signerUuid);
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

  // --- DRAFTS & SCHEDULER ---
  useEffect(() => {
    if (user?.fid) {
      const savedDrafts = localStorage.getItem("drafts_" + user.fid); 
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user?.fid]);

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
               onClick={handleNativeLogin}
               className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <FarcasterIcon />
               {loading ? 'Connecting...' : 'Sign In with Farcaster'}
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
         <button onClick={() => { setUser(null); }} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/20">Sign Out</button>
      </div>
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-xl p-5 space-y-4">
             <textarea className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]" placeholder="What's happening?" value={text} onChange={(e) => setText(e.target.value)} />
             <div className="flex gap-
