import { useEffect, useState } from "react";

interface Track {
  id: string;
  name: string;
  preview_url: string | null;
  artists: { name: string }[];
}

interface AlbumDetail {
  id: string;
  name: string;
  release_date: string;
  images: { url: string }[];
  artists: { name: string }[];
  tracks?: {
    items: Track[];
  };
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

    fetch(`/api/spotify/album?id=${album.id}`)
      .then((res) => res.json())
      .then((data) => setAlbumData(data));
  }, [album]);

  if (!album) return null;

  const tracks = albumData?.tracks?.items ?? [];

  return (
    <aside className="w-80 fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-lg p-4 overflow-y-auto transition-all duration-300">
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
          <img
            src={albumData.images?.[0]?.url}
            alt={albumData.name}
            className="rounded mb-3"
          />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {albumData.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {albumData.artists.map((a) => a.name).join(", ")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            발매일: {albumData.release_date}
          </p>

          <h4 className="text-md font-bold mb-2 text-gray-700 dark:text-gray-200">
            수록곡
          </h4>
          <ul className="space-y-2">
            {tracks.map((track, index) => (
              <li
                key={track.id}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {index + 1}. {track.name}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          불러오는 중...
        </p>
      )}
    </aside>
  );
}
