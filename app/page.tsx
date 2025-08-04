"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";
import dynamic from "next/dynamic";
import Skeleton from "./components/Skeleton";

const AuthButton = dynamic(() => import("./components/AuthButton"), {
  ssr: false,
});

type Album = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
};

type Artist = {
  id: string;
  name: string;
  image: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [country, setCountry] = useState("KR");
  const [genre, setGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  // 디바운스 처리
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // albums, artists fetch
  useEffect(() => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (genre) params.set("genre", genre);
    if (debouncedQuery) params.set("query", debouncedQuery);

    setLoading(true);
    fetch(`/api/spotify/search-or-new-releases?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.albums || []);
        setArtists(data.artists || []);
      })
      .finally(() => setLoading(false));
  }, [country, genre, debouncedQuery]);

  if (status === "loading") return <p>로딩 중...</p>;
  if (!session)
    return (
      <main className="p-4 max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">로그인이 필요합니다</h2>
        <AuthButton />
      </main>
    );

  return (
    <div className="flex">
      <main
        className={`p-6 transition-all duration-300 ${
          selectedAlbum ? "w-[calc(100%-320px)]" : "w-full"
        }`}
      >
        {/* 필터 UI */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            🎧 최신 앨범 탐색
          </h1>
          <AuthButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
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

          <div>
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

          <div className="col-span-1 sm:col-span-2 md:col-span-1">
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

        {/* 아티스트 키워드 영역 */}
        {loading ? (
          <Skeleton variant="artist" />
        ) : (
          <div className="mb-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto border-b border-gray-300 dark:border-gray-700 p-2">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => {
                  const album = albums.find((album) =>
                    album.artists.some((a) => a.id === artist.id)
                  );
                  if (album) {
                    const enrichedAlbum = {
                      ...album,
                      artists: album.artists.map((art) => {
                        const matchedArtist = artists.find(
                          (a) => a.id === art.id
                        );
                        return {
                          ...art,
                          image: matchedArtist?.image || "",
                        };
                      }),
                    };
                    setSelectedAlbum(enrichedAlbum);
                  }
                }}
                className="relative rounded m-3 overflow-hidden shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm font-semibold text-center py-1">
                  {artist.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 앨범 리스트 */}
        {loading ? (
          <Skeleton variant="album" count={10} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  const enrichedAlbum = {
                    ...album,
                    artists: album.artists.map((artist) => {
                      const matchedArtist = artists.find(
                        (a) => a.id === artist.id
                      );
                      return {
                        ...artist,
                        image: matchedArtist?.image || "",
                      };
                    }),
                  };
                  setSelectedAlbum(enrichedAlbum);
                }}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer"
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
        )}
      </main>
      <AlbumDetailPanel
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />
    </div>
  );
}
