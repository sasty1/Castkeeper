import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CastKeeper",
  description: "The pro scheduler for Farcaster",
  // Changing to this standard policy often works better on Android
  referrer: "no-referrer-when-downgrade",
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://placehold.co/1200x630/5E5CE6/ffffff?text=CastKeeper+Scheduler",
    "fc:frame:button:1": "🚀 Launch App",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://castkeeper-tsf3.vercel.app", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Explicitly adding the meta tag as a backup */}
        <meta name="referrer" content="no-referrer-when-downgrade" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
