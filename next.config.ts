import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.scdn.co", "mosaic.scdn.co", "wrapped-images.spotifycdn.com", "lh3.googleusercontent.com"],
  },
  env: {
    // 환경변수 로딩 순서 명시
    // 1. .env.local (로컬 개발)
    // 2. .env (기본값)
    // 3. Vercel 환경변수 (배포)
  },
  reactStrictMode: false,
};

export default nextConfig;
