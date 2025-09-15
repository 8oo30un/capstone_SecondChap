"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Track } from "@/types/spotify";

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  album_type: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
}

interface AlbumDetailPanelProps {
  album: SpotifyAlbum | null;
  onClose: () => void;
  onPlayAlbum?: (albumId: string) => void;
}

export default function AlbumDetailPanel({
  album,
  onClose,
  onPlayAlbum,
}: AlbumDetailPanelProps) {
  const [artistInfo, setArtistInfo] = useState<SpotifyArtist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (album && album.artists && album.artists.length > 0) {
      // 로딩 상태 초기화
      setIsLoading(true);
      setTracksLoading(true);
      setTracksError(null);
      setArtistInfo(null);

      fetchArtistInfo(album.artists[0].id);
      fetchAlbumTracks(album.id);
    }
  }, [album]);

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

  const fetchArtistInfo = async (artistId: string) => {
    try {
      const response = await fetch(`/api/spotify/artist?artistId=${artistId}`);
      if (response.ok) {
        const data = await response.json();
        setArtistInfo(data);
      }
    } catch (error) {
      console.error("아티스트 정보 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbumTracks = async (albumId: string) => {
    try {
      setTracksLoading(true);
      setTracksError(null);

      const response = await fetch(
        `/api/spotify/album-tracks?albumId=${albumId}`
      );
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []);
      } else {
        const errorData = await response.json();
        setTracksError(errorData.details || "트랙 목록을 불러올 수 없습니다.");
        console.error("트랙 목록 로드 오류:", errorData);
      }
    } catch (error) {
      console.error("트랙 목록 로드 오류:", error);
      setTracksError("트랙 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setTracksLoading(false);
    }
  };

  if (!album) return null;

  const albumImage = album.images?.[0]?.url;
  const releaseDate = new Date(album.release_date);
  const isNew =
    (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-50 flex justify-end cursor-pointer"
      onClick={onClose}
    >
      <aside
        className="w-96 h-full bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-l border-green-500/30 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 border-b border-green-500/30 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">앨범 정보</h2>
                <p className="text-sm text-green-300">Album Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200"
              aria-label="앨범 정보 닫기"
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
          <div className="p-6 space-y-6">
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-green-300 font-medium">
                  앨범 정보를 불러오는 중...
                </p>
              </div>
            )}

            {/* 앨범 커버 */}
            <div className="text-center">
              <div className="relative inline-block">
                {albumImage ? (
                  <Image
                    src={albumImage}
                    alt={album.name}
                    width={200}
                    height={200}
                    className="rounded-2xl shadow-2xl shadow-green-500/20 hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-green-500/20">
                    🎵
                  </div>
                )}
                {isNew && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    NEW
                  </div>
                )}
              </div>
            </div>

            {/* 앨범 제목 */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent mb-2">
                {album.name}
              </h1>
              <p className="text-green-300 text-sm">
                {album.album_type.charAt(0).toUpperCase() +
                  album.album_type.slice(1)}
              </p>
            </div>

            {/* 아티스트 정보 */}
            {artistInfo && (
              <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30">
                <div className="flex items-center space-x-3">
                  {artistInfo.images?.[0]?.url ? (
                    <Image
                      src={artistInfo.images[0].url}
                      alt={artistInfo.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-green-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {artistInfo.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {artistInfo.name}
                    </h3>
                    <p className="text-sm text-green-300">아티스트</p>
                  </div>
                </div>
              </div>
            )}

            {/* 출시일 */}
            <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">출시일</p>
                  <p className="text-white font-medium">
                    {releaseDate.toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 재생 버튼 */}
            <div className="text-center">
              <button
                onClick={() => {
                  if (onPlayAlbum && album) {
                    onPlayAlbum(album.id);
                  }
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>음악 플레이어에서 재생</span>
              </button>
            </div>

            {/* 트랙 목록 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span>트랙 목록 ({tracks.length}곡)</span>
              </h3>

              {tracksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">트랙 정보를 불러오는 중...</p>
                </div>
              ) : tracksError ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-2">
                    트랙 목록을 불러올 수 없습니다
                  </p>
                  <p className="text-gray-500 text-sm">{tracksError}</p>
                  <button
                    onClick={() => fetchAlbumTracks(album.id)}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              ) : tracks.length > 0 ? (
                <div
                  className="space-y-2 max-h-64 overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#06b6d4 #1e293b",
                  }}
                >
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-sm text-gray-400 w-8 text-center">
                          {track.track_number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {track.name}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {track.explicit && (
                          <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                            E
                          </span>
                        )}
                        <span className="text-sm text-gray-400">
                          {Math.floor(track.duration_ms / 60000)}:
                          {((track.duration_ms % 60000) / 1000)
                            .toFixed(0)
                            .padStart(2, "0")}
                        </span>
                        <button
                          onClick={() => {
                            if (onPlayAlbum && album) {
                              onPlayAlbum(album.id);
                            }
                          }}
                          className="text-green-400 hover:text-green-300 transition-colors"
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">트랙 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
