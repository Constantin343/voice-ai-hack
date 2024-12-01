import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgentProvider } from '@/contexts/AgentContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "publyc",
  description: "Build your personal brand and grow an audience as a founder. Capture your thoughts anywhere, go viral everywhere - in minutes.",
  keywords: ["AI", "content creation", "writing assistant", "AI writer", "content generator"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "AI Content Assistant",
    description: "Create engaging content in seconds with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AgentProvider>
          {children}
        </AgentProvider>
        <Toaster />
      </body>
    </html>
  );
}
