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
  const [logs, setLogs] = useState<string[]>([]);
  
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [pendingSignerUuid, setPendingSignerUuid] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

  useEffect(() => {
    const load = async () => { 
      try {
        addLog("SDK: Loading context...");
        const context = await sdk.context;
        if (context?.user) {
          addLog("SDK: User found: " + context.user.username);
          setFrameUser({
            fid: context.user.fid,
            username: context.user.username,
            pfp: context.user.pfpUrl
          });
        } else {
          addLog("SDK: No user in context");
        }
        sdk.actions.ready(); 
      } catch(e: any) {
        addLog("SDK Error: " + e.message);
      }
    };
    if (!isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  useEffect(() => {
    if (user?.fid) {
      const savedSigner = localStorage.getItem("signer_" + user.fid);
      if (savedSigner) {
        setSignerUuid(savedSigner);
        addLog("Loaded saved signer: " + savedSigner.slice(0, 5) + "...");
      }
    }
  }, [user]);

  const requestSigner = async () => {
    setLoading(true);
    setStatus({msg: 'Creating signer...', type: 'neutral'});
    addLog("API: Requesting /api/connect...");
    
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      addLog("API Response Status: " + res.status);
      
      const data = await res.json();
      if (!res.ok || data.error) {
         addLog("API Error Body: " + JSON.stringify(data));
         throw new Error(data.error || 'Signer Setup Failed');
      }
      
      addLog("Signer Created: " + data.signerUuid);
      setApprovalUrl(data.link);
      setPendingSignerUuid(data.signerUuid);
      
      // Try open URL
      addLog("Attempting to open URL...");
      try { 
        await sdk.actions.openUrl(data.link); 
        addLog("SDK openUrl success");
      } catch(e: any) { 
        addLog("SDK openUrl failed, using window.open: " + e.message);
        window.open(data.link, '_blank'); 
      }
      
      setStatus({msg: 'Please approve in new window', type: 'neutral'});
      checkSignerStatus(data.signerUuid, true);
      
    } catch (e: any) {
      addLog("Catch Error: " + e.message);
      setStatus({msg: e.message, type: 'error'});
      setLoading(false);
    }
  };

  const checkSignerStatus = async (uuidToCheck: string, isAutoPoll = false) => {
    try {
        if(!isAutoPoll) addLog("Checking status for: " + uuidToCheck);
        const poll = await fetch("/api/connect?signerUuid=" + uuidToCheck);
        const statusData = await poll.json();
        
        if(!isAutoPoll) addLog("Status: " + statusData.status);

        if (statusData.status === 'approved') {
          setSignerUuid(uuidToCheck);
          if (user?.fid) localStorage.setItem("signer_" + user.fid, uuidToCheck);
          
          setStatus({msg: 'Posting enabled!', type: 'success'});
          setLoading(false);
          setApprovalUrl(null); 
          setPendingSignerUuid(null);
          addLog("Success: Signer approved");
          return true;
        } else {
           if (!isAutoPoll) setStatus({msg: 'Not approved yet (' + statusData.status + ')', type: 'error'});
           return false;
        }
    } catch(e: any) {
        if (!isAutoPoll) {
          addLog("Check Status Error: " + e.message);
          setStatus({msg: 'Check failed', type: 'error'});
        }
        return false;
    }
  };

  const handleCastDirectly = async (textToCast: string) => {
    if (!signerUuid) {
      setStatus({msg: 'Enable posting first', type: 'error'});
      return;
    }
    setLoading(true);
    addLog("Casting: " + textToCast);
    try {
      const response = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castText: textToCast, signerUuid: signerUuid }),
      });
      const data = await response.json();
      addLog("Cast Response: " + JSON.stringify(data));
      
      if (data.success) {
        setStatus({msg: 'Published!', type: 'success'});
        setText(''); 
      } else {
        setStatus({msg: data.error, type: 'error'});
      }
    } catch (e: any) { 
        addLog("Cast Network Error: " + e.message);
        setStatus({msg: 'Network error', type: 'error'}); 
    } 
    finally { setLoading(false); }
  };

  // --- LOGIN UI ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6 text-white">
        <h1 className="text-3xl font-bold mb-4">CastKeeper Debug</h1>
        <p className="mb-4">Waiting for Frame Context...</p>
        <div className="bg-gray-900 p-4 rounded text-left text-xs font-mono h-40 overflow-auto w-full max-w-md border border-gray-700">
           {logs.map((l, i) => <div key={i} className="border-b border-gray-800 py-1">{l}</div>)}
        </div>
        <button onClick={() => window.location.reload()} className="mt-4 bg-gray-700 px-4 py-2 rounded">Reload Page</button>
      </div>
    );
  }

  // --- MAIN UI ---
  return (
    <div className="w-full max-w-lg space-y-6 relative z-10 pb-20">
      <div className="flex justify-between items-center px-2">
         <h1 className="text-xl font-bold text-white">@{user.username}</h1>
         <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded">Sign Out</button>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-xl p-5 space-y-4">
            <textarea 
              className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[100px]" 
              placeholder="What's happening?" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
            />
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                  {!signerUuid ? (
                    <button onClick={requestSigner} disabled={loading} className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-yellow-600 text-white">
                        {loading ? 'Working...' : 'Enable Posting'}
                    </button>
                  ) : (
                    <button onClick={() => handleCastDirectly(text)} disabled={loading} className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-blue-600 text-white">
                      {loading ? 'Casting...' : 'Cast Now'}
                    </button>
                  )}
              </div>

              {approvalUrl && !signerUuid && (
                  <div className="flex gap-2">
                      <button onClick={() => sdk.actions.openUrl(approvalUrl)} className="flex-1 text-xs bg-gray-800 text-white py-2 rounded border border-gray-600">
                         Open Link Again
                      </button>
                      <button onClick={() => pendingSignerUuid && checkSignerStatus(pendingSignerUuid)} className="flex-1 text-xs bg-green-900 text-white py-2 rounded border border-green-600">
                         Check Approval Status
                      </button>
                  </div>
              )}
            </div>
          </div>
      </div>

      {status && (
        <div className={"text-center p-2 rounded " + (status.type === 'error' ? 'bg-red-900 text-white' : 'bg-green-900 text-white')}>
          {status.msg}
        </div>
      )}
      
      {/* DEBUG LOG CONSOLE */}
      <div className="bg-black border border-gray-800 p-2 rounded text-xs font-mono text-green-400 h-40 overflow-y-auto w-full mt-4">
          <div className="text-white font-bold border-b border-gray-700 mb-2">DEBUG LOGS:</div>
          {logs.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
      </div>
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
