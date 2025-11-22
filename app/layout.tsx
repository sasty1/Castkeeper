import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CastKeeper",
  description: "The pro scheduler for Farcaster",
  other: {
    // This makes it a Frame!
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
