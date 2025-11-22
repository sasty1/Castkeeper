"use client";

import { useState, useEffect, useRef } from "react";
import {
  NeynarContextProvider,
  Theme,
  NeynarAuthButton,
  useNeynarContext,
} from "@neynar/react";
import "@neynar/react/dist/style.css";

// --- ICONS ---
const SendIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


function CastKeeperApp() {
  const { user } = useNeynarContext();
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [targetDate, setTargetDate] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const timerRef = useRef(null);

  // Load drafts
  useEffect(() => {
    if (user?.fid) {
      const saved = localStorage.getItem(`drafts_${user.fid}`);
      if (saved) setDrafts(JSON.parse(saved));
    }
  }, [user?.fid]);

  // Scheduler timer
  useEffect(() => {
    if (!isScheduled || !targetDate) return;

    const tick = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timerRef.current);
        handleCast(text);
        resetSchedule();
      } else {
        const sec = Math.floor((diff / 1000) % 60);
        const min = Math.floor((diff / 1000 / 60) % 60);
        const hr = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        setTimeLeft(`${days}d ${hr}h ${min}m ${sec}s`);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);
  }, [isScheduled, targetDate, text]);


  const saveDraft = () => {
    if (!text) return;
    const draft = { id: Date.now(), text, date: new Date().toLocaleString() };

    const updated = [draft, ...drafts];
    setDrafts(updated);

    if (user?.fid) {
      localStorage.setItem(`drafts_${user.fid}`, JSON.stringify(updated));
    }

    setText("");
    setStatus({ msg: "Draft saved", type: "success" });
    setTimeout(() => setStatus(null), 2500);
  };


  const startSchedule = () => {
    if (!targetDate) return;
    if (new Date(targetDate).getTime() <= Date.now()) {
      setStatus({ msg: "Pick a future time", type: "error" });
      return;
    }
    setIsScheduled(true);
    setStatus({ msg: "Scheduled. Keep tab open.", type: "neutral" });
  };


  const resetSchedule = () => {
    setIsScheduled(false);
    setTargetDate("");
    setTimeLeft("");
    clearInterval(timerRef.current);
  };


  const handleCast = async (msg) => {
    if (!msg) return;
    setLoading(true);

    try {
      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castText: msg,
          signerUuid: user?.signer_uuid,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ msg: "Cast posted!", type: "success" });
        if (!isScheduled) setText("");
      } else {
        setStatus({ msg: data.error || "Failed", type: "error" });
      }
    } catch {
      setStatus({ msg: "Network error", type: "error" });
    }

    setLoading(false);
  };


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-8 p-6">
        <h1 className="text-5xl font-bold text-white">CastKeeper</h1>
        <p className="text-gray-400">The pro scheduler. Login to begin.</p>
        <div className="p-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
          <NeynarAuthButton />
        </div>
      </div>
    );
  }


  return (
    <div className="w-full max-w-lg space-y-6 relative">

      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <h1 className="text-xl font-bold text-white">@{user.username}</h1>
        <div className="scale-75">
          <NeynarAuthButton variant={Theme.Dark} />
        </div>
      </div>


      {/* Composer */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1">
        <div className="bg-black/40 rounded-xl p-5 space-y-4">

          <textarea
            className="w-full bg-transparent text-white text-lg p-2 outline-none resize-none min-h-[120px]"
            placeholder="What's happening?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading || isScheduled}
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleCast(text)}
              disabled={!text || loading || isScheduled}
              className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? "Casting..." : <><SendIcon /> Cast Now</>}
            </button>

            <button
              onClick={saveDraft}
              disabled={!text}
              className="bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl"
            >
              <SaveIcon />
            </button>
          </div>


          {/* Scheduler */}
          <div className="pt-4 border-t border-white/10">

            {!isScheduled ? (
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="flex-1 bg-black/50 border border-gray-700 text-white rounded-lg p-2"
                />

                <button
                  onClick={startSchedule}
                  className="bg-gray-800 border border-gray-700 text-white px-4 rounded-lg"
                >
                  Schedule
                </button>
              </div>
            ) : (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex justify-between">
                <div className="flex items-center text-purple-200">
                  <ClockIcon /> {timeLeft}
                </div>
                <button
                  onClick={resetSchedule}
                  className="bg-red-500/20 text-red-300 px-3 py-1 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      </div>


      {/* Drafts */}
      {drafts.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-xs uppercase px-2">Saved Drafts</h3>

          <div className="max-h-[200px] overflow-y-auto space-y-2">

            {drafts.map((d) => (
              <div
                key={d.id}
                onClick={() => setText(d.text)}
                className="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <div className="overflow-hidden">
                  <p className="text-gray-300 text-sm truncate">{d.text}</p>
                  <p className="text-gray-600 text-xs">{d.date}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = drafts.filter((x) => x.id !== d.id);
                    setDrafts(updated);
                    localStorage.setItem(`drafts_${user.fid}`, JSON.stringify(updated));
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-2"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}

          </div>
        </div>
      )}


      {/* Toast */}
      {status && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 rounded-full border text-white">
          {status.msg}
        </div>
      )}

    </div>
  );
}


// --- MAIN PAGE WRAPPER ---
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative">

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px]" />

      <NeynarContextProvider
        settings={{
          clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
          defaultTheme: Theme.Dark,
        }}
      >
        <CastKeeperApp />
      </NeynarContextProvider>

    </main>
  );
}
