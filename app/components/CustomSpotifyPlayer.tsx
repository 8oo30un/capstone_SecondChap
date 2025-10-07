"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// 타입 정의
interface AlbumImage {
  url: string;
  height: number;
  width: number;
}

interface Artist {
  name: string;
  id: string;
}

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: Artist[];
  external_urls: {
    spotify: string;
  };
}

interface AlbumInfo {
  id: string;
  name: string;
  images: AlbumImage[];
  artists: Artist[];
  release_date: string;
  total_tracks: number;
  tracks: {
    items: Track[];
  };
  external_urls: {
    spotify: string;
  };
}

interface CustomSpotifyPlayerProps {
  albumId: string;
  className?: string;
}

export default function CustomSpotifyPlayer({
  albumId,
  className = "",
}: CustomSpotifyPlayerProps) {
  const [albumInfo, setAlbumInfo] = useState<AlbumInfo | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // 앨범 정보 가져오기
  useEffect(() => {
    const fetchAlbumInfo = async () => {
      try {
        const response = await fetch(`/api/spotify/album?id=${albumId}`);
        if (response.ok) {
          const data = await response.json();
          setAlbumInfo(data);
          setTracks(data.tracks?.items || []);
        }
      } catch (error) {
        console.error("앨범 정보 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumInfo();
  }, [albumId]);

  if (loading) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl ${className}`}
      >
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400 font-medium">
            앨범 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (!albumInfo) {
    return (
      <div
        className={`bg-gradient-to-br from-red-900/20 via-red-800/10 to-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-2xl ${className}`}
      >
        <div className="p-8 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-medium">
            앨범 정보를 불러올 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10 ${className}`}
    >
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          {albumInfo.images?.[0] && (
            <Image
              src={albumInfo.images[0].url}
              alt={albumInfo.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg shadow-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl">{albumInfo.name}</h3>
            <p className="text-green-400 text-sm">
              {albumInfo.artists
                ?.map((artist: Artist) => artist.name)
                .join(", ")}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {albumInfo.release_date} • {albumInfo.total_tracks}곡
            </p>
          </div>
          <div className="text-right">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mb-2"></div>
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* 트랙 리스트 */}
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors duration-200 border-b border-gray-700/30 last:border-b-0"
          >
            <div className="text-gray-400 text-sm w-8 text-center">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{track.name}</p>
              <p className="text-gray-400 text-sm truncate">
                {track.artists?.map((artist: Artist) => artist.name).join(", ")}
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              {Math.floor(track.duration_ms / 60000)}:
              {Math.floor((track.duration_ms % 60000) / 1000)
                .toString()
                .padStart(2, "0")}
            </div>
            <button
              onClick={() =>
                window.open(track.external_urls?.spotify, "_blank")
              }
              className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Spotify에서 재생</span>
          </div>
          <div className="flex items-center gap-4">
            <span>앱에서도 재생 가능</span>
            <button
              onClick={() =>
                window.open(albumInfo.external_urls?.spotify, "_blank")
              }
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors duration-200"
            >
              Spotify에서 열기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
