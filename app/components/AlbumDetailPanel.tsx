"use client";
import Image from "next/image";

type Album = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string }[];
  artists: { name: string }[];
  tracks?: { items: { name: string; id: string }[] };
  external_urls: { spotify: string };
};

type Props = {
  album: Album | null;
  onClose: () => void;
};

export default function AlbumDetailPanel({ album, onClose }: Props) {
  if (!album) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg p-4 overflow-auto z-50">
      <button
        onClick={onClose}
        className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        ✕ 닫기
      </button>
      <Image
        src={album.images?.[0]?.url}
        alt={album.name}
        width={300}
        height={300}
        className="rounded mb-4"
      />
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        {album.name}
      </h2>
      <p className="mb-1 text-gray-700 dark:text-gray-300">
        아티스트: {album.artists.map((a) => a.name).join(", ")}
      </p>
      <p className="mb-1 text-gray-700 dark:text-gray-300">
        발매일: {album.release_date}
      </p>
      <p className="mb-2 text-blue-600 dark:text-blue-400">
        <a href={album.external_urls.spotify} target="_blank" rel="noreferrer">
          Spotify에서 앨범 보기
        </a>
      </p>
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
          수록곡
        </h3>
        <ul className="list-disc list-inside text-gray-800 dark:text-gray-300 max-h-60 overflow-auto">
          {album.tracks?.items.map((track) => (
            <li key={track.id}>{track.name}</li>
          )) || <li>정보 없음</li>}
        </ul>
      </div>
    </aside>
  );
}
