"use client";
import { useEffect, useState } from "react";
import Image from "next/image"; // ✅ Next.js 이미지 컴포넌트

// ✅ 타입 정의 (Spotify Album)
type Album = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { name: string }[];
};

export default function HomePage() {
  const [albums, setAlbums] = useState<Album[]>([]); // ✅ 명확한 타입 지정

  useEffect(() => {
    fetch("/api/spotify/new-releases")
      .then((res) => res.json())
      .then((data) => setAlbums(data.albums?.items || []));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">🎧 최신 발매 앨범</h1>
      <ul>
        {albums.map((album) => (
          <li key={album.id} className="mb-6">
            {/* ✅ next/image 사용 */}
            <Image
              src={album.images?.[0]?.url}
              alt={album.name}
              width={200}
              height={200}
              className="rounded"
            />
            <p className="font-semibold mt-2">{album.name}</p>
            <p className="text-sm text-gray-600">
              {album.artists.map((a) => a.name).join(", ")}
            </p>
            <a
              href={album.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm"
            >
              Spotify에서 보기 →
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
