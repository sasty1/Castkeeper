"use client";

import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import "@neynar/react/dist/style.css";

// Icons
const FarcasterIcon = () => <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/></svg>;
const SendIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LinkIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const ImageIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const POPULAR_CHANNELS = [
  { id: 'general', name: 'General' },
  { id: 'dev', name: 'Dev' },
  { id: 'memes', name: 'Memes' },
  { id: 'art', name: 'Art' },
  { id: 'crypto', name: 'Crypto' },
];
function CastKeeperApp() {
  const [user, setUser] = useState<any>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success'|'error'|'neutral'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
      const context = await sdk.context;
      if (context?.user) {
        setUser(context.user);
        const savedSigner = localStorage.getItem("signer_" + context.user.fid);
        if (savedSigner) setSignerUuid(savedSigner);
      }
      setIsSDKLoaded(true);
    };
    if (sdk && !isSDKLoaded) { 
      load(); 
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    if (user?.fid) {
      fetchScheduledPosts();
      const savedDrafts = localStorage.getItem("drafts_" + user.fid);
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }
  }, [user?.fid]);

  const fetchScheduledPosts = async () => {
    if (!user?.fid) return;
    try {
      const response = await fetch(`/api/scheduled?fid=${user.fid}`);
      const data = await response.json();
      setScheduledPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

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
      setTimeout(() => setStatus(null), 2000);
    } catch (e: any) {
      console.error('Login error:', e);
      setStatus({msg: 'Login failed. Try again.', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  const handleSmartCast = async () => {
    if (!text) { alert("Please enter text first!"); return; }
    if (!signerUuid) { await requestSigner(); return; }
    await handleCastDirectly(text);
  };
const requestSigner = async () => {
    setLoading(true);
    setStatus({msg: 'Requesting permission...', type: 'neutral'});
    
    try {
      console.log('Step 1: Creating signer...');
      const signerRes = await fetch('/api/auth/signer', {
        method: 'POST',
      });
      
      if (!signerRes.ok) {
        const errorText = await signerRes.text();
        throw new Error(`Failed to create signer: ${errorText}`);
      }
      
      const signer = await signerRes.json();
      console.log('✅ Signer created:', signer);

      console.log('Step 2: Registering signed key...');
      const signedKeyRes = await fetch('/api/auth/signer/signed_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerUuid: signer.signer_uuid,
          publicKey: signer.public_key,
        }),
      });
      
      if (!signedKeyRes.ok) {
        const errorText = await signedKeyRes.text();
        throw new Error(`Failed to register signed key: ${errorText}`);
      }
      
      const signedKeyData = await signedKeyRes.json();
      console.log('✅ Signed key registered');

      const url = signedKeyData.signer_approval_url;
      setApprovalUrl(url);

      console.log('Step 3: Opening Warpcast...');
      sdk.actions.openUrl(url);

      const checkStatus = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/auth/signer?signerUuid=${signer.signer_uuid}`);
          const statusData = await pollRes.json();

          if (statusData.status === 'approved') {
            clearInterval(checkStatus);
            console.log('🎉 Signer approved!');
            setSignerUuid(signer.signer_uuid);
            localStorage.setItem("signer_" + user.fid, signer.signer_uuid);
            setStatus({msg: 'Approved! Click Cast again.', type: 'success'});
            setLoading(false);
            setApprovalUrl(null);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(checkStatus);
        if (loading) {
          setLoading(false);
          setStatus({msg: 'Approval timeout. Try again.', type: 'error'});
        }
      }, 300000);

    } catch (e: any) {
      console.error('Signer request error:', e);
      setStatus({msg: e.message, type: 'error'});
      setLoading(false);
      setApprovalUrl(null);
    }
  };
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setImages([...images, data.url]);
        setStatus({ msg: 'Image uploaded!', type: 'success' });
        setTimeout(() => setStatus(null), 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setStatus({ msg: 'Image upload failed', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?fid=${user.fid}`);
      const data = await response.json();
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const saveDraft = () => {
    if (!text) return;
    const newDraft = { id: Date.now(), text, date: new Date().toLocaleString() };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    if (user?.fid) localStorage.setItem("drafts_" + user.fid, JSON.stringify(updatedDrafts));
    setText('');
    setImages([]);
    setStatus({msg: 'Draft saved!', type: 'success'});
    setTimeout(() => setStatus(null), 3000);
  };

  const startSchedule = async () => {
    if (!targetDate || !text) {
      alert('Please enter text and select a date/time');
      return;
    }
    if (!signerUuid) {
      alert('Please approve posting permission first');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          text,
          scheduledTime: targetDate,
          signerUuid,
          channelId: selectedChannel,
          embeds: images.map(url => ({ url })),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ msg: '✅ Scheduled! Will post automatically.', type: 'success' });
        setText('');
        setImages([]);
        setSelectedChannel(null);
        setTargetDate('');
        fetchScheduledPosts();
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to schedule');
      }
    } catch (error: any) {
      setStatus({ msg: 'Schedule failed: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/scheduled?postId=${postId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStatus({ msg: 'Scheduled post deleted', type: 'success' });
        fetchScheduledPosts();
        setTimeout(() => setStatus(null), 2000);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCastDirectly = async (textToCast: string) => {
    setLoading(true);
    try {
      const castData: any = { 
        castText: textToCast, 
        signerUuid: signerUuid 
      };
      if (selectedChannel) {
        castData.channelId = selectedChannel;
      }
      if (images.length > 0) {
        castData.embeds = images.map(url => ({ url }));
      }
      const response = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(castData),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({msg: 'Published successfully!', type: 'success'});
        setText('');
        setImages([]);
        setSelectedChannel(null);
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({msg: data.error, type: 'error'});
      }
    } catch (e: any) {
      setStatus({msg: 'Network error', type: 'error'});
    } finally { 
      setLoading(false); 
    }
  };

  const openApprovalManually = () => {
    if (approvalUrl) {
      sdk.actions.openUrl(approvalUrl);
    }
  };
const AnalyticsDashboard = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Stats</h2>
          <button 
            onClick={() => setShowAnalytics(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Casts</p>
            <p className="text-3xl font-bold text-white">{analytics?.totalCasts || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Likes</p>
            <p className="text-3xl font-bold text-purple-400">{analytics?.totalLikes || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Avg Likes/Cast</p>
            <p className="text-3xl font-bold text-blue-400">{analytics?.avgLikes || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Recasts</p>
            <p className="text-3xl font-bold text-green-400">{analytics?.totalRecasts || 0}</p>
          </div>
        </div>
        {analytics?.mostEngaged && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-400 font-semibold mb-2">🔥 Most Engaged Cast</p>
            <p className="text-white mb-2">{analytics.mostEngaged.text}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">❤️ {analytics.mostEngaged.likes}</span>
              <span className="text-gray-400">🔄 {analytics.mostEngaged.recasts}</span>
            </div>
            <a 
              href={analytics.mostEngaged.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 text-sm mt-2 inline-block hover:underline"
            >
              View cast →
            </a>
          </div>
        )}
      </div>
    </div>
  );

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
               disabled={loading}
               className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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
         <div className="flex gap-2">
           <button 
             onClick={fetchAnalytics}
             className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1 rounded hover:bg-purple-500/20"
           >
             📊 Stats
           </button>
           <button 
             onClick={() => { setUser(null); setSignerUuid(null); }} 
             className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/20"
           >
             Sign Out
           </button>
         </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-xl p-5 space-y-4">
             <div className="flex items-center gap-2">
               <span className="text-gray-400 text-sm">Post to:</span>
               <select
                 value={selectedChannel || ''}
                 onChange={(e) => setSelectedChannel(e.target.value || null)}
                 className="bg-black/50 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition-colors"
               >
                 <option value="">Home feed</option>
                 {POPULAR_CHANNELS.map(channel => (
                   <option key={channel.id} value={channel.id}>
                     /{channel.id}
                   </option>
                 ))}
               </select>
             </div>

             <textarea 
               className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]" 
               placeholder="What's happening?" 
               value={text} 
               onChange={(e) => setText(e.target.value)} 
             />

             <div className="flex gap-2 items-center">
               <input
                 type="file"
                 accept="image/*"
                 onChange={handleImageUpload}
                 className="hidden"
                 id="image-upload"
               />
               <label
                 htmlFor="image-upload"
                 className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
               >
                 <ImageIcon />
               </label>
               {uploadingImage && <span className="text-xs text-gray-400">Uploading...</span>}
             </div>

             {images.length > 0 && (
               <div className="flex gap-2 flex-wrap">
                 {images.map((url, i) => (
                   <div key={i} className="relative">
                     <img src={url} alt="Upload" className="w-20 h-20 object-cover rounded" />
                     <button
                       onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
             )}

             <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSmartCast}
                  disabled={loading || !text}
                  className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (signerUuid ? 'Casting...' : 'Waiting for approval...') : <><SendIcon /> Cast Now</>}
                </button>

                <button 
                  onClick={saveDraft} 
                  disabled={!text} 
                  className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  <SaveIcon />
                </button>
             </div>

             {loading && approvalUrl && !signerUuid && (
                <button 
                  onClick={openApprovalManually} 
                  className="w-full text-xs text-yellow-400 hover:text-yellow-300 underline flex items-center justify-center py-2"
                >
                  <LinkIcon /> Tap here if approval screen didn't open
                </button>
             )}

             <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><ClockIcon /></div>
                    <input 
                      type="datetime-local" 
                      className="w-full bg-black/50 border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-purple-500 transition-colors" 
                      value={targetDate} 
                      onChange={(e) => setTargetDate(e.target.value)} 
                    />
                  </div>
                  <button 
                    onClick={startSchedule} 
                    disabled={loading || !text || !targetDate}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-700 transition-colors disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
            </div>
          </div>
      </div>
{scheduledPosts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">Scheduled Posts</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {scheduledPosts.map((post: any) => (
              <div 
                key={post.id} 
                className="group flex justify-between items-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl"
              >
                <div className="overflow-hidden flex-1">
                  <p className="text-white text-sm truncate">{post.text}</p>
                  <p className="text-purple-400 text-xs mt-1">
  📅 {new Date(post.scheduled_time).toLocaleString()}
</p>
                </div>
                <button 
                  onClick={() => deleteScheduledPost(post.id)} 
                  className="text-gray-400 hover:text-red-400 p-2 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">Saved Drafts</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {drafts.map((draft: any) => (
              <div 
                key={draft.id} 
                onClick={() => setText(draft.text)} 
                className="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all"
              >
                <div className="overflow-hidden">
                  <p className="text-gray-300 text-sm truncate">{draft.text}</p>
                  <p className="text-gray-600 text-xs mt-1">{draft.date}</p>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const newDrafts = drafts.filter((d: any) => d.id !== draft.id); 
                    setDrafts(newDrafts); 
                    localStorage.setItem("drafts_" + user.fid, JSON.stringify(newDrafts)); 
                  }} 
                  className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800 text-white border border-gray-700 whitespace-nowrap z-50 shadow-lg">
          {status.msg}
        </div>
      )}

      {showAnalytics && analytics && <AnalyticsDashboard />}
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
