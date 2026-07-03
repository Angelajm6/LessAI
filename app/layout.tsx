import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LessAI — AI adoption for teams",
  description: "Get your team AI-ready with personalized paths, weekly micro-skills, and real adoption tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased bg-gray-950">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
