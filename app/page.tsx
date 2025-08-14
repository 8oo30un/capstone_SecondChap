"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";
import ArtistDetailPanel from "./components/ArtistDetailPanel";
import dynamic from "next/dynamic";
import Skeleton from "./components/Skeleton";
import { FavoriteDropZone, DropItem } from "./components/FavoriteDropZone";

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
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<DropItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const headerGradient = useMemo(() => {
    if (genre === "k-pop") return "from-pink-500 to-purple-600";
    if (genre === "pop") return "from-indigo-500 to-sky-500";
    if (genre === "rock") return "from-gray-700 to-red-700";
    if (genre === "hip hop") return "from-amber-500 to-orange-600";
    if (searchQuery) return "from-fuchsia-500 to-cyan-500";
    if (country === "KR") return "from-rose-500 to-pink-600";
    if (country === "JP") return "from-violet-500 to-indigo-600";
    if (country === "US") return "from-blue-600 to-emerald-500";
    if (country === "GB") return "from-indigo-600 to-purple-600";
    return "from-emerald-500 to-teal-600";
  }, [genre, searchQuery, country]);

  const handleDropItem = useCallback((item: DropItem) => {
    console.log("handleDropItem called with item:", item);
    setFavorites((prev) => {
      if (prev.find((fav) => fav.id === item.id)) {
        console.log("Item already in favorites:", item);
        return prev;
      }
      const newFavs = [...prev, item];
      console.log("New favorites array:", newFavs);
      return newFavs;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleArtistClick = useCallback((artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbum(null); // 앨범 상세 패널 닫기
  }, []);

  const handleArtistFavorite = useCallback(
    (artist: Artist) => {
      const newFavorite: DropItem = {
        id: artist.id,
        name: artist.name,
        image: artist.image,
        type: "artist",
      };

      // 이미 즐겨찾기에 있는지 확인
      if (
        favorites.find((fav) => fav.id === artist.id && fav.type === "artist")
      ) {
        // 즐겨찾기에서 제거
        setFavorites((prev) =>
          prev.filter((fav) => !(fav.id === artist.id && fav.type === "artist"))
        );
      } else {
        // 즐겨찾기에 추가
        setFavorites((prev) => [...prev, newFavorite]);
      }
    },
    [favorites]
  );

  // 추가로 favorites 변화 감지 로그
  useEffect(() => {
    console.log("Favorites state updated:", favorites);
  }, [favorites]);

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

    // 즐겨찾기된 아티스트 ID들 추가
    const favoriteArtistIds = favorites
      .filter((item) => item.type === "artist")
      .map((item) => item.id);
    if (favoriteArtistIds.length > 0) {
      params.set("favoriteArtistIds", favoriteArtistIds.join(","));
    }

    setLoading(true);
    fetch(`/api/spotify/search-or-new-releases?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.albums || []);
        setArtists(data.artists || []);
      })
      .finally(() => setLoading(false));
  }, [country, genre, debouncedQuery, favorites]);

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
      {/* 즐겨찾기 사이드바 */}
      <FavoriteDropZone
        favorites={favorites}
        setFavorites={setFavorites}
        onDropItem={handleDropItem}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onArtistClick={handleArtistClick}
      />

      {/* 메인 콘텐츠 */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-[320px]" : "ml-0"
        } ${selectedAlbum || selectedArtistId ? "pr-[320px]" : "pr-0"}`}
      >
        {/* 필터 UI */}
        <div
          className={`mb-6 p-6  bg-gradient-to-r ${headerGradient} text-white shadow-sm`}
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            🎧{" "}
            {searchQuery
              ? `"${searchQuery}" 검색 결과`
              : favorites.filter((f) => f.type === "artist").length > 0
              ? "즐겨찾기 아티스트 신곡"
              : `${
                  country === "KR"
                    ? "한국"
                    : country === "JP"
                    ? "일본"
                    : country === "US"
                    ? "미국"
                    : country === "GB"
                    ? "영국"
                    : ""
                } 최신 앨범 탐색`}
          </h1>
        </div>

        <div className="px-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Country
              </label>
              <select
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="KR">🇰🇷 한국 (K-pop)</option>
                <option value="US">🇺🇸 미국 (Pop/Hip Hop)</option>
                <option value="JP">🇯🇵 일본 (J-pop)</option>
                <option value="GB">🇬🇧 영국 (British Rock)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Genre
              </label>
              <select
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Search
              </label>
              <input
                type="text"
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-full"
                placeholder="아티스트나 노래 제목 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 아티스트 키워드 영역 */}
        {loading ? (
          <Skeleton variant="artist" />
        ) : (
          <div className="px-6 mb-6">
            {/* 즐겨찾기 아티스트가 없을 때 안내 UI */}
            {favorites.filter((f) => f.type === "artist").length === 0 &&
              !searchQuery && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      즐겨찾기 아티스트를 추가해보세요!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                      좋아하는 아티스트를 즐겨찾기에 추가하면, 해당 아티스트들의
                      최신 음악을 우선적으로 볼 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            {/* 즐겨찾기 아티스트가 있을 때만 아티스트 그리드 표시 (검색 중이 아닐 때) */}
            {favorites.filter((f) => f.type === "artist").length > 0 &&
              !searchQuery && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      즐겨찾기 아티스트
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {favorites.filter((f) => f.type === "artist").length}명
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto border-b border-gray-300 dark:border-gray-700 p-2">
                    {favorites
                      .filter((f) => f.type === "artist")
                      .map((fav) => {
                        const artistImage =
                          fav.image ||
                          artists.find((a) => a.id === fav.id)?.image ||
                          "";
                        const artistName =
                          fav.name ||
                          artists.find((a) => a.id === fav.id)?.name ||
                          "";
                        return (
                          <div key={fav.id} className="relative">
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    id: fav.id,
                                    name: artistName,
                                    image: artistImage,
                                    type: "artist",
                                  })
                                );
                              }}
                              onClick={() => handleArtistClick(fav.id)}
                              className="group relative rounded m-3 overflow-hidden shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                              {artistImage ? (
                                <Image
                                  src={artistImage}
                                  alt={artistName}
                                  width={300}
                                  height={180}
                                  className="w-full h-24 object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:brightness-75"
                                />
                              ) : (
                                <div className="w-full h-24 bg-gray-200 dark:bg-gray-700" />
                              )}
                              <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm font-semibold text-center py-1">
                                {artistName}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArtistFavorite({
                                    id: fav.id,
                                    name: artistName,
                                    image: artistImage,
                                  });
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                                aria-label="즐겨찾기 토글"
                              >
                                <svg
                                  className="w-7 h-7 text-red-500 drop-shadow"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            {/* 검색 결과가 있을 때 아티스트 그리드 표시 */}
            {searchQuery && artists.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    검색된 아티스트
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {artists.length}명
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto border-b border-gray-300 dark:border-gray-700 p-2">
                  {artists.map((artist) => {
                    const isFavorite = favorites.some(
                      (fav) => fav.type === "artist" && fav.id === artist.id
                    );
                    return (
                      <div key={artist.id} className="relative">
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: artist.id,
                                name: artist.name,
                                image: artist.image,
                                type: "artist",
                              })
                            );
                          }}
                          onClick={() => handleArtistClick(artist.id)}
                          className="group relative rounded m-3 overflow-hidden shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        >
                          {artist.image ? (
                            <Image
                              src={artist.image}
                              alt={artist.name}
                              width={300}
                              height={180}
                              className="w-full h-24 object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:brightness-75"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm font-semibold text-center py-1">
                            {artist.name}
                          </div>
                          {/* 중앙 하트 버튼 (호버 시 표시) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArtistFavorite(artist);
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                            aria-label="즐겨찾기 토글"
                          >
                            {isFavorite ? (
                              <svg
                                className="w-7 h-7 text-red-500 drop-shadow"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {/* 검색 결과가 없을 때 안내 */}
            {searchQuery && artists.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  다른 키워드로 검색해보세요
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  검색 초기화
                </button>
              </div>
            )}
          </div>
        )}

        {/* 앨범 리스트 */}
        {loading ? (
          <Skeleton variant="album" count={10} />
        ) : (
          <>
            {/* 즐겨찾기 아티스트가 있을 때만 앨범 리스트 표시 */}
            {favorites.filter((f) => f.type === "artist").length > 0 ? (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    즐겨찾기 아티스트 신곡
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {albums.length}개 앨범
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                  {albums.map((album) => {
                    const isFavoriteArtist = album.artists.some((artist) =>
                      favorites.some(
                        (fav) => fav.type === "artist" && fav.id === artist.id
                      )
                    );

                    return (
                      <div
                        key={album.id}
                        draggable
                        onDragStart={(e) => {
                          const firstArtist = album.artists[0];
                          if (firstArtist) {
                            const matchedArtist = artists.find(
                              (a) => a.id === firstArtist.id
                            );
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: firstArtist.id,
                                name: firstArtist.name,
                                image: matchedArtist?.image || "",
                                type: "artist",
                              })
                            );
                          }
                        }}
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
                          setSelectedArtistId(null); // 아티스트 상세 패널 닫기
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer relative"
                      >
                        {/* 즐겨찾기 아티스트 표시 */}
                        {isFavoriteArtist && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg border border-white/20 backdrop-blur-sm">
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>즐겨찾기</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {album.images?.[0]?.url ? (
                          <Image
                            src={album.images[0].url}
                            alt={album.name}
                            width={300}
                            height={300}
                            className="rounded-md w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-md bg-gray-200 dark:bg-gray-700" />
                        )}
                        <h2 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {album.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {album.artists.map((a) => {
                            const isFavorite = favorites.some(
                              (fav) => fav.type === "artist" && fav.id === a.id
                            );
                            return (
                              <span
                                key={a.id}
                                className={`${
                                  isFavorite
                                    ? "inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold"
                                    : ""
                                }`}
                              >
                                {a.name}
                                {isFavorite && (
                                  <svg
                                    className="w-3 h-3 text-purple-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </span>
                            );
                          })}
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
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 즐겨찾기 아티스트가 없을 때 안내 메시지 */
              <div className="px-6 pb-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                    <div className="w-20 h-20 flex items-center justify-center mx-auto bg-gray-100 dark:bg-gray-800 rounded-full">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        className="w-12 h-12 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-3">
                    아직 즐겨찾기한 아티스트가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">
                    위에서 좋아하는 아티스트를 검색하고 즐겨찾기에 추가하면,
                    <br />
                    해당 아티스트들의 최신 음악을 볼 수 있습니다.
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        const searchInput = document.querySelector(
                          'input[placeholder="아티스트나 노래 제목 검색..."]'
                        ) as HTMLInputElement;
                        if (searchInput) {
                          searchInput.focus();
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      아티스트 검색하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AlbumDetailPanel
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />

      <ArtistDetailPanel
        artistId={selectedArtistId}
        onClose={() => setSelectedArtistId(null)}
      />
    </div>
  );
}
