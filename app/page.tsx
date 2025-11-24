"use client";

import { useState, useEffect, useRef } from 'react';
import sdk from '@farcaster/frame-sdk';
import "@neynar/react/dist/style.css";

const FarcasterIcon = () => <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/></svg>;
const SendIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const KeyIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.5 15.5a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077l4.774-4.566A6 6 0 0115 7zm0 2a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
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
  
  // NEW: Store the approval URL so we can show it manually if needed
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

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
      setStatus({msg: 'Signed in!', type: 'success'});
    } catch (e) { setStatus({msg: 'Login failed', type: 'error'}); } 
    finally { setLoading(false); }
  };

  const requestSigner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || data.error) {
         throw new Error(data.error || 'Signer Setup Failed');
      }
      
      // Save the URL so we can show a manual button
      setApprovalUrl(data.link);
      
      // Try to open automatically
      sdk.actions.openUrl(data.link);
      
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
              setApprovalUrl(null); // Clear the manual button
            }
        } catch(ignored) {}
      }, 2000);
      
    } catch (e: any) {
      setStatus({msg: e.message, type: 'error'});
      setLoading(false);
    }
  };

  // ... (Drafts/Scheduler logic same as before) ...
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
            <p className="text-[#888] text-lg leading-relaxed px-4">Sign in to access your scheduler.</p>
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
             <div className="flex gap-3 pt-2">
                {!signerUuid ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <button onClick={requestSigner} disabled={loading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold bg-yellow-600 hover:bg-yellow-500 text-white transition-all">
                      {loading ? 'Waiting...' : <><KeyIcon /> Enable Posting</>}
                    </button>
                    
                    {/* MANUAL FALLBACK BUTTON */}
                    {loading && approvalUrl && (
                      <button 
                        onClick={() => sdk.actions.openUrl(approvalUrl)} 
                        className="w-full text-xs text-yellow-400 hover:text-yellow-300 underline flex items-center justify-center"
                      >
                        <LinkIcon /> Tap here if approval screen didn't open
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleCastDirectly(text)} disabled={loading || !text} className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-[1.02] transition-all">
                    {loading ? 'Casting...' : <><SendIcon /> Cast Now</>}
                  </button>
                )}
                <button onClick={saveDraft} disabled={!text} className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-3 rounded-xl transition-colors"><SaveIcon /></button>
             </div>
             
             {/* Scheduler UI */}
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
      {status && <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white border border-gray-700 whitespace-nowrap">{status.msg}</div>}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 overflow-hidden relative">
       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px]" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px]" />
       <CastKeeperApp />
    </main>
  );
}
