"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  genres?: string[];
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

interface ArtistDetailPanelProps {
  artistId: string | null;
  onClose: () => void;
  onPlayAlbum?: (albumId: string) => void;
}

export default function ArtistDetailPanel({
  artistId,
  onClose,
  onPlayAlbum,
}: ArtistDetailPanelProps) {
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchArtistData = useCallback(async () => {
    if (!artistId) return;

    try {
      setError(null);

      // 아티스트 정보와 앨범을 병렬로 가져오기
      const [artistResponse, albumsResponse] = await Promise.all([
        fetch(`/api/spotify/artist?artistId=${artistId}`),
        fetch(`/api/spotify/artist-albums?artistId=${artistId}`),
      ]);

      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        setArtist(artistData);
      } else {
        setError("아티스트 정보를 불러올 수 없습니다.");
      }

      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setAlbums(albumsData.albums || []);
      } else {
        setError("앨범 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("아티스트 데이터 로드 오류:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    }
  }, [artistId]);

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId, fetchArtistData]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!artistId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-50 flex justify-end cursor-pointer"
      onClick={onClose}
    >
      <aside
        className="w-96 h-full bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-l border-gray-500/30 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">아티스트 정보</h2>
                <p className="text-sm text-gray-300">Artist Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200"
              aria-label="아티스트 정보 닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#06b6d4 #1e293b",
          }}
        >
          <div className="p-6 space-y-0">
            {error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-red-400 font-medium mb-2">오류 발생</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            ) : artist ? (
              <>
                {/* 아티스트 이미지 */}
                <div className="text-center">
                  <div className="relative inline-block">
                    {artist.images?.[0]?.url ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        width={200}
                        height={200}
                        className="rounded-full shadow-2xl shadow-gray-500/30 border-4 border-gray-500/30 hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-2xl shadow-gray-500/30 border-4 border-gray-500/30">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                    {/* 인기도 표시 */}
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {artist.popularity}%
                    </div>
                  </div>
                </div>

                {/* 아티스트 이름 */}
                <div className="text-center">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]">
                    {artist.name}
                  </h1>
                </div>

                {/* 장르 */}
                {artist.genres && artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {artist.genres.slice(0, 5).map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* 통계 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {artist.popularity}
                    </p>
                    <p className="text-sm text-gray-300">인기도</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <svg
                        className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {albums.length}
                    </p>
                    <p className="text-sm text-gray-300">앨범 수</p>
                  </div>
                </div>

                {/* 아티스트 정보 */}
                <div className="text-center mt-8 mb-8">
                  <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold rounded-xl shadow-lg">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span>아티스트 정보</span>
                  </div>
                </div>

                {/* 앨범 목록 */}
                {albums.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <span>앨범 목록 ({albums.length}개)</span>
                    </h3>
                    <div className="space-y-3">
                      {albums.slice(0, 10).map((album) => (
                        <div
                          key={album.id}
                          className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 hover:border-gray-500/30 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            {album.images?.[0]?.url ? (
                              <Image
                                src={album.images[0].url}
                                alt={album.name}
                                width={48}
                                height={48}
                                className="rounded-lg border border-gray-600/30"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                🎵
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {album.name}
                              </h4>
                              <p className="text-xs text-gray-300">
                                {new Date(album.release_date).getFullYear()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (onPlayAlbum) {
                                  onPlayAlbum(album.id);
                                }
                              }}
                              className="p-2 text-green-400 hover:text-white hover:bg-green-500/20 rounded-lg transition-all duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
