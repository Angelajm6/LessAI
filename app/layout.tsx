import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LessAI — Turn your AI tools into daily habits",
  description: "LessAI gives every team member a personalized daily AI practice based on their role, company, and tool stack. Onboard in 2 minutes. Built for teams.",
  keywords: ["AI adoption", "AI productivity", "team AI tools", "ChatGPT for teams", "AI onboarding", "prompt library", "AI coaching"],
  authors: [{ name: "LessAI", url: "https://lessai.io" }],
  metadataBase: new URL("https://lessai.io"),
  openGraph: {
    title: "LessAI — Turn your AI tools into daily habits",
    description: "Personalized daily tasks, prompt playbooks, and team adoption tracking — built around your exact tool stack. Try free for 7 days.",
    url: "https://lessai.io",
    siteName: "LessAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LessAI — AI adoption platform for teams",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LessAI — Turn your AI tools into daily habits",
    description: "Personalized daily tasks, prompt playbooks, and team adoption tracking — built around your exact tool stack.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://lessai.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased bg-white">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
