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
        url: "/icon-512x512.svg",
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
    images: ["/icon-512x512.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/favicon-32x32.svg", sizes: "32x32", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-32x32.svg",
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
        <link rel="icon" href="/favicon-32x32.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#0f172a" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
