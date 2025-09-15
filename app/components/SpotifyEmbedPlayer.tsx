"use client";

import React, { useState } from "react";

interface SpotifyEmbedPlayerProps {
  albumId: string;
  className?: string;
}

export default function SpotifyEmbedPlayer({
  albumId,
  className = "",
}: SpotifyEmbedPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10 ${className}`}
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Spotify Player</h3>
              <p className="text-green-400 text-sm">앨범 재생 중</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* 플레이어 영역 */}
      <div className="p-4">
        <div className="relative bg-black/20 rounded-xl overflow-hidden border border-gray-700/30">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-3"></div>
                <p className="text-green-400 font-medium">
                  Spotify 플레이어 로딩 중...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  잠시만 기다려주세요
                </p>
              </div>
            </div>
          )}

          <iframe
            src={`https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen={false}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* 푸터 */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Spotify에서 재생 중</span>
          </div>
          <div className="flex items-center gap-4">
            <span>앱에서도 재생 가능</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Premium</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
