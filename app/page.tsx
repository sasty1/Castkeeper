"use client";

import React, { useState, useEffect } from "react";
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import sdk from "@farcaster/frame-sdk";
import "@neynar/react/dist/style.css";

const FarcasterIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
    <path d="M12 14c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/>
  </svg>
);

// Simple ErrorBoundary component
class ErrorBoundary extends React.Component<{children:any}, {error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    // ensure it logs to console too
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return <ErrorReport error={this.state.error} />;
    }
    return this.props.children;
  }
}

// UI to display errors and some environment info
function ErrorReport({ error }: { error: any }) {
  const [extra, setExtra] = useState({ ua: "", href: "", ref: "" });
  useEffect(() => {
    setExtra({
      ua: typeof navigator !== "undefined" ? (navigator.userAgent || "") : "",
      href: typeof location !== "undefined" ? location.href : "",
      ref: typeof document !== "undefined" ? document.referrer || "" : "",
    });
  }, []);
  return (
    <div style={{ padding: 20, color: "#fff", background: "#0b0b0b", minHeight: "100vh", fontFamily: "monospace" }}>
      <h2 style={{ color: "#ffd700" }}>Runtime Error caught</h2>
      <pre style={{ whiteSpace: "pre-wrap", color: "#fff", background: "#111", padding: 12, borderRadius: 8 }}>
        {String(error && (error.stack || error.message || JSON.stringify(error)))}
      </pre>

      <h3 style={{ color: "#9fd" }}>Environment</h3>
      <div style={{ background: "#111", padding: 12, borderRadius: 8 }}>
        <div><strong>User agent:</strong><br />{extra.ua}</div>
        <div style={{ height: 8 }} />
        <div><strong>Location.href:</strong><br />{extra.href}</div>
        <div style={{ height: 8 }} />
        <div><strong>Document.referrer:</strong><br />{extra.ref || "(empty)"}</div>
      </div>

      <h3 style={{ color: "#9fd", marginTop: 12 }}>What to do</h3>
      <ol>
        <li>Copy the full text above (error + environment) and paste it here.</li>
        <li>If there is no error text, open the app in a normal Chrome tab (same URL) and check console via remote debugging (instructions below).</li>
      </ol>
    </div>
  );
}

function CastKeeperAppInner() {
  const { user } = useNeynarContext();
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      // tell frame sdk we're ready — safe guard
      if (sdk && sdk.actions && typeof sdk.actions.ready === "function") {
        sdk.actions.ready();
      }
    } catch (e) {
      console.error("sdk.actions.ready() error:", e);
    }
  }, []);

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "";
    const redirectUri = "https://castkeeper-tsf3.vercel.app";

    const loginUrl =
      "https://app.neynar.com/login" +
      "?client_id=" + clientId +
      "&response_type=code" +
      "&scope=signer_client_write" +
      "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&mode=mobile" +
      "&prompt=consent";

    // wrap in warpcast path to force in-app context
    const wrapped = "https://warpcast.com/~/add-cast?url=" + encodeURIComponent(loginUrl);

    // use sdk.actions.openUrl but guard for SDK shape differences
    try {
      if (sdk && sdk.actions && typeof sdk.actions.openUrl === "function") {
        sdk.actions.openUrl(wrapped);
      } else if (typeof window !== "undefined") {
        // final fallback — will open externally
        window.location.href = wrapped;
      }
    } catch (e) {
      console.error("openUrl error:", e);
      // show fallback link
      window.location.href = wrapped;
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-center p-6">
        <h1 className="text-5xl font-medium text-white">CastKeeper</h1>
        <p className="text-[#888] text-lg px-4">Sign in to access your scheduler.</p>

        <button
          onClick={handleLogin}
          className="w-full bg-[#5E5CE6] hover:bg-[#4d4bbd] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2"
        >
          <FarcasterIcon />
          Sign In with Farcaster
        </button>
      </div>
    );
  }

  return (
    <div style={{ color: "#fff", padding: 20 }}>
      <div>Logged in as @{user.username}</div>
    </div>
  );
}

export default function Home() {
  // Capture global errors and show them (so Warpcast doesn't hide them)
  const [globalError, setGlobalError] = useState<any>(null);

  useEffect(() => {
    const onErr = (msg: any, src?: any, line?: any, col?: any, err?: any) => {
      console.error("window.onerror:", msg, err);
      setGlobalError(err || msg);
      return false; // allow default handler too
    };
    const onRej = (ev: any) => {
      console.error("unhandledrejection:", ev);
      setGlobalError(ev && (ev.reason || ev));
    };

    (window as any).addEventListener && window.addEventListener("error", (e: any) => onErr(e.message || e, e.filename, e.lineno, e.colno, e.error));
    (window as any).addEventListener && window.addEventListener("unhandledrejection", onRej);

    return () => {
      (window as any).removeEventListener && window.removeEventListener("error", (e: any) => onErr(e.message || e, e.filename, e.lineno, e.colno, e.error));
      (window as any).removeEventListener && window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (globalError) {
    return <ErrorReport error={globalError} />;
  }

  return (
    <NeynarContextProvider settings={{ clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "", defaultTheme: Theme.Dark }}>
      <ErrorBoundary>
        <CastKeeperAppInner />
      </ErrorBoundary>
    </NeynarContextProvider>
  );
}
