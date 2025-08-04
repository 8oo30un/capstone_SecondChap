"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
    <main className="p-4 max-w-3xl mx-auto">
      <AuthButton />
      <h1 className="text-xl font-bold mb-4">🎧 신곡 및 검색</h1>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <label>
          Country:
          <select
            className="ml-2 border px-2 py-1"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="KR">KR</option>
            <option value="US">US</option>
            <option value="JP">JP</option>
            <option value="GB">GB</option>
          </select>
        </label>

        <label>
          Genre:
          <select
            className="ml-2 border px-2 py-1"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All</option>
            <option value="k-pop">K-pop</option>
            <option value="pop">Pop</option>
            <option value="rock">Rock</option>
            <option value="hip hop">Hip Hop</option>
          </select>
        </label>

        <label className="flex-1 min-w-[200px]">
          Search:
          <input
            type="text"
            className="ml-2 border px-2 py-1 w-full"
            placeholder="검색어 입력..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <ul>
        {albums.map((album) => (
          <li key={album.id} className="mb-6 flex items-center gap-4">
            <Image
              src={album.images?.[0]?.url}
              alt={album.name}
              width={100}
              height={100}
              className="rounded"
            />
            <div>
              <p className="font-semibold">{album.name}</p>
              <p className="text-sm text-gray-600">
                {album.artists.map((a) => a.name).join(", ")}
              </p>
              <a
                href={album.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm"
              >
                Spotify에서 보기 →
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
