"use client";

import { useState, useEffect, useRef } from 'react';

interface Draft {
  id: number;
  text: string;
  date: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  
  // Scheduling states
  const [targetDate, setTargetDate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Ref to track the timer interval so we can clear it
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Drafts & Check for Active Schedule on Startup
  useEffect(() => {
    // Load Drafts
    const savedDrafts = localStorage.getItem('cast_drafts');
    if (savedDrafts) setDrafts(JSON.parse(savedDrafts));

    // Check for an existing active schedule
    const savedSchedule = localStorage.getItem('cast_schedule');
    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      // Only resume if the time hasn't passed yet
      if (new Date(parsed.target).getTime() > Date.now()) {
        setText(parsed.text);
        setTargetDate(parsed.target);
        setIsScheduled(true);
        setStatus('🔄 Resumed saved schedule');
      } else {
        // Clean up old schedule if time passed while closed
        localStorage.removeItem('cast_schedule');
      }
    }
  }, []);

  // 2. The Countdown Logic
  useEffect(() => {
    if (!isScheduled || !targetDate) return;

    const checkTime = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        // TIME IS UP!
        clearInterval(timerRef.current!);
        handleCast();
        resetSchedule();
      } else {
        // Update display
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    // Run immediately then every second
    checkTime();
    timerRef.current = setInterval(checkTime, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isScheduled, targetDate]);

  // Helper: Save Draft
  const saveDraft = () => {
    if (!text) return;
    const newDraft = { id: Date.now(), text, date: new Date().toLocaleString() };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem('cast_drafts', JSON.stringify(updatedDrafts));
    setText('');
    setStatus('✅ Draft saved locally');
  };

  // Helper: Load Draft
  const loadDraft = (draft: Draft) => {
    setText(draft.text);
  };

  // Helper: Delete Draft
  const deleteDraft = (id: number) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('cast_drafts', JSON.stringify(updated));
  };

  // Schedule Functions
  const startSchedule = () => {
    if (!targetDate) return;
    const targetTime = new Date(targetDate).getTime();
    
    if (targetTime <= Date.now()) {
      setStatus('❌ Time must be in the future');
      return;
    }

    setIsScheduled(true);
    setStatus('⏳ Scheduled! Keep this tab open.');
    
    // Persist schedule to LocalStorage so it survives refresh
    localStorage.setItem('cast_schedule', JSON.stringify({
      text: text,
      target: targetDate
    }));
  };

  const cancelSchedule = () => {
    resetSchedule();
    setStatus('🛑 Schedule cancelled');
  };

  const resetSchedule = () => {
    setIsScheduled(false);
    setTimeLeft('');
    setTargetDate('');
    localStorage.removeItem('cast_schedule');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // API Call
  const handleCast = async () => {
    // If triggered by timer, we use state. If manual, we check text.
    if (!text) return;
    
    setLoading(true);
    if (!isScheduled) setStatus('🚀 Sending...');
    
    try {
      const response = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castText: text }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ Published! Hash: ${data.castHash.substring(0, 10)}...`);
        if (!isScheduled) setText(''); // Clear text if manual send
        resetSchedule();
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setStatus('❌ Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-black text-white font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-500">CastKeeper</h1>
          <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Admin Mode</span>
        </div>

        {/* --- MAIN INPUT AREA --- */}
        <div className="space-y-4">
          <textarea
            className="w-full p-4 text-black rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none text-lg disabled:bg-gray-300 disabled:text-gray-600"
            rows={4}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isScheduled || loading} 
          />

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleCast}
              disabled={loading || !text || isScheduled}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition ${
                loading || !text || isScheduled
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {loading ? 'Publishing...' : 'Cast Now'}
            </button>

            <button
              onClick={saveDraft}
              disabled={!text || isScheduled}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 disabled:opacity-50"
            >
              Save Draft
            </button>
          </div>
        </div>

        {/* --- DATE & TIME SCHEDULER --- */}
        <div className="p-5 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span>📅 Schedule Post</span>
          </h2>
          
          {!isScheduled ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="datetime-local" 
                className="flex-1 p-3 rounded bg-black border border-gray-700 text-white color-scheme-dark"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <button 
                onClick={startSchedule}
                disabled={!text || !targetDate}
                className="px-6 py-3 bg-blue-700 text-white font-bold rounded hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500"
              >
                Start Timer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-blue-900/30 p-4 rounded border border-blue-500/50">
                <div>
                  <div className="text-blue-300 text-xs uppercase font-bold mb-1">Time Remaining</div>
                  <div className="text-white font-mono text-2xl font-bold tracking-wider animate-pulse">
                    {timeLeft}
                  </div>
                  <div className="text-blue-400 text-xs mt-1">
                    Scheduled for: {new Date(targetDate).toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={cancelSchedule}
                  className="px-4 py-2 bg-red-500/20 text-red-200 hover:bg-red-500/40 border border-red-500/50 rounded transition"
                >
                  Cancel
                </button>
              </div>
              <div className="text-center text-yellow-500 text-xs bg-yellow-900/20 p-2 rounded">
                ⚠️ Important: Keep this tab open. If you close it, the cast will not send.
              </div>
            </div>
          )}
        </div>

        {/* --- STATUS MESSAGE --- */}
        {status && (
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center text-sm break-all">
            {status}
          </div>
        )}

        {/* --- DRAFTS LIST --- */}
        {drafts.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Saved Drafts</h2>
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800 flex justify-between items-start group hover:border-gray-600 transition">
                  <div 
                    onClick={() => !isScheduled && loadDraft(draft)}
                    className={`flex-1 pr-4 ${!isScheduled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <p className="text-gray-200 line-clamp-2">{draft.text}</p>
                    <p className="text-xs text-gray-500 mt-2">{draft.date}</p>
                  </div>
                  <button 
                    onClick={() => deleteDraft(draft.id)}
                    className="text-gray-600 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
