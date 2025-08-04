"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";

const AuthButton = dynamic(() => import("./components/AuthButton"), {
  ssr: false,
});

type Album = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { name: string }[];
};

export default function HomePage() {
  const { data: session, status } = useSession();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [country, setCountry] = useState("KR");
  const [genre, setGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // 디바운스 처리
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (genre) params.set("genre", genre);
    if (debouncedQuery) params.set("query", debouncedQuery);
    fetch(`/api/spotify/search-or-new-releases?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setAlbums(data.albums || []));
  }, [country, genre, debouncedQuery]);

  const isLoading = status === "loading";
  const isUnauthenticated = !session;

  if (isLoading) {
    return <p>로딩 중...</p>;
  }

  if (isUnauthenticated) {
    return (
      <main className="p-4 max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">로그인이 필요합니다</h2>
        <AuthButton />
      </main>
    );
  }

  return (
    <div className="flex">
      <main
        className={`p-6 transition-all duration-300 ${
          selectedAlbum ? "w-[calc(100%-320px)]" : "w-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            🎧 최신 앨범 탐색
          </h1>
          <AuthButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="KR">KR</option>
              <option value="US">US</option>
              <option value="JP">JP</option>
              <option value="GB">GB</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">All</option>
              <option value="k-pop">K-pop</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hip hop">Hip Hop</option>
            </select>
          </div>

          <div className="flex flex-col col-span-1 sm:col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              className="border rounded px-3 py-2 text-sm"
              placeholder="검색어 입력..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbum(album)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <Image
                src={album.images?.[0]?.url}
                alt={album.name}
                width={300}
                height={300}
                className="rounded-md w-full h-auto object-cover"
              />
              <h2 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                {album.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {album.artists.map((a) => a.name).join(", ")}
              </p>
              <a
                href={album.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition"
                aria-label={`Play ${album.name} on Spotify`}
              >
                ▶ 재생하기
              </a>
            </div>
          ))}
        </div>
      </main>
      <AlbumDetailPanel
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />
    </div>
  );
}
