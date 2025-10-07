// app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SecondChap - Music Discovery Platform",
  description:
    "AI-powered music discovery platform that learns your taste and introduces you to artists and albums you never knew you needed.",
  keywords: [
    "music",
    "discovery",
    "AI",
    "music",
    "recommendations",
    "cyberpunk",
  ],
  authors: [{ name: "SecondChap Team" }],
  creator: "SecondChap",
  publisher: "SecondChap",
  robots: "index, follow",
  openGraph: {
    title: "SecondChap - Music Discovery Platform",
    description:
      "AI-powered music discovery platform that learns your taste and introduces you to artists and albums you never knew you needed.",
    url: "https://secondchap.vercel.app",
    siteName: "SecondChap",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "SecondChap Logo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecondChap - Music Discovery Platform",
    description:
      "AI-powered music discovery platform that learns your taste and introduces you to artists and albums you never knew you needed.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
