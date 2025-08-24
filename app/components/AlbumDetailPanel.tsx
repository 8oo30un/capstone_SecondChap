import { useEffect, useState } from "react";
import Image from "next/image";
import Skeleton from "@/app/components/Skeleton";

interface Track {
  id: string;
  name: string;
  preview_url: string | null;
  artists: { name: string }[];
  external_urls: { spotify: string };
  duration_ms: number;
}

interface AlbumDetail {
  id: string;
  name: string;
  release_date: string;
  images: { url: string }[];
  artists: { name: string; image?: string }[];
  tracks?: {
    items: Track[];
  };
  external_urls: { spotify: string };
}

// 시간을 mm:ss 형식으로 변환하는 함수
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AlbumDetailPanel({
  album,
  onClose,
}: {
  album: AlbumDetail | null;
  onClose: () => void;
}) {
  const [albumData, setAlbumData] = useState<AlbumDetail | null>(null);

  useEffect(() => {
    if (!album) {
      setAlbumData(null);
      return;
    }

    // 앨범 정보와 아티스트 이미지를 병렬로 가져오기
    const fetchAlbumData = async () => {
      try {
        // 1. 앨범 정보 가져오기
        const albumRes = await fetch(`/api/spotify/album?id=${album.id}`);
        const albumData = await albumRes.json();

        // 2. 각 아티스트의 이미지를 병렬로 가져오기
        const artistsWithImages = await Promise.all(
          albumData.artists.map(
            async (artist: { id: string; name: string }) => {
              try {
                // 아티스트 ID가 있으면 이미지 가져오기
                if (artist.id) {
                  const artistRes = await fetch(
                    `/api/spotify/artist?id=${artist.id}`
                  );
                  if (artistRes.ok) {
                    const artistData = await artistRes.json();
                    return {
                      ...artist,
                      image: artistData.images?.[0]?.url || "",
                    };
                  }
                }
                return { ...artist, image: "" };
              } catch (error) {
                console.error(
                  `Error fetching artist image for ${artist.name}:`,
                  error
                );
                return { ...artist, image: "" };
              }
            }
          )
        );

        setAlbumData({ ...albumData, artists: artistsWithImages });
      } catch (error) {
        console.error("Error fetching album data:", error);
      }
    };

    fetchAlbumData();
  }, [album]);

  if (!album) return null;

  const tracks = albumData?.tracks?.items ?? [];

  return (
    <aside className="w-80 fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-lg p-4 overflow-y-auto transition-all duration-300 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          앨범 정보
        </h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ✕ 닫기
        </button>
      </div>

      {albumData ? (
        <div>
          {albumData.images?.[0]?.url ? (
            <Image
              src={albumData.images[0].url}
              alt={albumData.name}
              width={600}
              height={600}
              className="rounded mb-3 w-full h-auto"
            />
          ) : (
            <div className="w-full aspect-square rounded bg-gray-200 dark:bg-gray-700 mb-3" />
          )}
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {albumData.name}
          </h3>

          <div className="flex flex-col gap-2 mb-4">
            {albumData.artists.map((artist) => (
              <div key={artist.name} className="flex items-center gap-3">
                {artist.image ? (
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300" />
                )}
                <span className="text-sm text-gray-800 dark:text-gray-100">
                  {artist.name}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            발매일: {albumData.release_date}
          </p>

          {/* 전체 앨범 재생 버튼 */}
          <div className="mb-6">
            <a
              href={albumData.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              전체 앨범 재생 (Spotify)
            </a>
          </div>

          <h4 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            수록곡 ({tracks.length}곡)
          </h4>

          <ul className="space-y-2">
            {tracks.map((track, index) => (
              <li
                key={track.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {track.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDuration(track.duration_ms)}
                  </span>

                  {/* 개별 곡 재생 버튼 */}
                  <a
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
                    title={`${track.name} 재생`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Skeleton variant="albumDetail" count={1} />
      )}
    </aside>
  );
}
