import React, { useEffect, useState } from "react";
import Image from "next/image";

type ArtistAlbum = {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  album_type: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
};

type ArtistInfo = {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
};

type ArtistDetailPanelProps = {
  artistId: string | null;
  onClose: () => void;
};

export default function ArtistDetailPanel({
  artistId,
  onClose,
}: ArtistDetailPanelProps) {
  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) {
      setArtist(null);
      setAlbums([]);
      return;
    }

    const fetchArtistAlbums = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/spotify/artist-albums?artistId=${artistId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch artist albums");
        }

        const data = await response.json();
        setArtist(data.artist);
        setAlbums(data.albums);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArtistAlbums();
  }, [artistId]);

  if (!artistId) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAlbumTypeLabel = (type: string) => {
    switch (type) {
      case "album":
        return "앨범";
      case "single":
        return "싱글";
      case "compilation":
        return "컴필레이션";
      default:
        return type;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto z-30">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            아티스트 상세
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="패널 닫기"
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

      {/* 로딩 상태 */}
      {loading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="p-4 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 아티스트 정보 */}
      {artist && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center mb-4">
            {artist.images && artist.images[0] && (
              <Image
                src={artist.images[0].url}
                alt={artist.name}
                width={120}
                height={120}
                className="rounded-full mx-auto mb-3 shadow-lg"
              />
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {artist.name}
            </h3>
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {artist.genres.slice(0, 3).map((genre, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>인기도: {artist.popularity}%</span>
              <span>앨범: {albums.length}개</span>
            </div>
            <a
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition"
            >
              Spotify에서 보기
            </a>
          </div>
        </div>
      )}

      {/* 앨범 목록 */}
      {albums.length > 0 && (
        <div className="p-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            앨범 목록 ({albums.length})
          </h4>
          <div className="space-y-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <div className="flex space-x-3">
                  {album.images && album.images[0] && (
                    <Image
                      src={album.images[0].url}
                      alt={album.name}
                      width={60}
                      height={60}
                      className="rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {album.name}
                    </h5>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {getAlbumTypeLabel(album.album_type)}
                      </span>
                      <span>{album.total_tracks}곡</span>
                      <span>{formatDate(album.release_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <a
                    href={album.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                  >
                    Spotify에서 듣기 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 앨범이 없는 경우 */}
      {!loading && !error && albums.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            이 아티스트의 앨범 정보를 찾을 수 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
