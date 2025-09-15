"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function CyberpunkLanding() {
  const { data: session, status } = useSession();
  const [isHovered, setIsHovered] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400/60 font-mono">LOADING...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // 로그인된 경우 렌더링하지 않음
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
      {/* 사이버펑크 그리드 배경 */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* 미묘한 글로우 효과들 */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-magenta-400/5 rounded-full blur-3xl"></div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* 브랜드 로고 */}
        <div className="mb-16">
          <div className="inline-flex items-center space-x-8 mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl flex items-center justify-center border border-cyan-400/30 shadow-2xl">
                <span className="text-8xl text-cyan-400 font-black tracking-wider">
                  S
                </span>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-3xl blur opacity-40"></div>
            </div>
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-slate-100 via-cyan-400 to-slate-100 bg-clip-text text-transparent tracking-tight">
              SecondChap
            </h1>
          </div>

          <div className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-800/30 backdrop-blur-sm border border-cyan-400/20 rounded-2xl">
            <div className="w-3 h-3 bg-cyan-400/60 rounded-full"></div>
            <p className="text-lg font-mono text-slate-300/80 tracking-widest uppercase">
              Music Discovery Platform
            </p>
            <div className="w-3 h-3 bg-cyan-400/60 rounded-full"></div>
          </div>
        </div>

        {/* 메인 설명 */}
        <div className="max-w-4xl mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">
            Discover Your Next
            <span className="block text-cyan-400">Musical Obsession</span>
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
            AI-powered music discovery platform that learns your taste and
            introduces you to artists and albums you never knew you needed.
            Connect with our music platform and start your musical journey into
            the future.
          </p>
        </div>

        {/* 로그인 버튼 */}
        <div className="mb-16">
          <button
            onClick={() => signIn("google")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative px-12 py-6 text-xl font-mono text-cyan-400 bg-slate-800/60 backdrop-blur-sm border-2 border-cyan-400/30 rounded-2xl hover:bg-cyan-400/10 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden transform hover:scale-105"
          >
            {/* 배경 글로우 효과 */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-transparent transition-all duration-500 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            ></div>

            {/* 스캐너 라인 효과 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            {/* 컨텐츠 */}
            <div className="relative flex items-center space-x-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="tracking-widest text-2xl">START DISCOVERY</span>
            </div>
          </button>
        </div>

        {/* 특징들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm border border-cyan-400/10 rounded-xl hover:border-cyan-400/30 transition-all duration-300">
            <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              Smart Discovery
            </h3>
            <p className="text-slate-400">
              AI-powered recommendations based on your musical taste
            </p>
          </div>

          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm border border-cyan-400/10 rounded-xl hover:border-cyan-400/30 transition-all duration-300">
            <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⭐</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              Personal Favorites
            </h3>
            <p className="text-slate-400">
              Save and organize your favorite artists and albums
            </p>
          </div>

          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm border border-cyan-400/10 rounded-xl hover:border-cyan-400/30 transition-all duration-300">
            <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              Future-Ready
            </h3>
            <p className="text-slate-400">
              Built with cutting-edge technology for tomorrow&apos;s music
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
