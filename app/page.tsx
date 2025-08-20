"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";
import ArtistDetailPanel from "./components/ArtistDetailPanel";
import dynamic from "next/dynamic";
import Skeleton from "./components/Skeleton";
import { FavoriteDropZone, DropItem } from "./components/FavoriteDropZone";
import LoginButton from "./components/LoginButton";

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
  const [isComposing, setIsComposing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<DropItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 중복 제거된 고유한 검색 결과 (이름과 ID 모두 고려)
  const uniqueArtists = useMemo(() => {
    console.log("🔍 uniqueArtists 생성 - 원본 artists 개수:", artists.length);

    const seenIds = new Set(); // ID 중복 체크
    const seenNames = new Map(); // 이름 -> 최고 품질 아티스트 매핑

    const result = artists.filter((artist) => {
      // ID 중복 체크
      if (seenIds.has(artist.id)) {
        console.log(`❌ ID 중복: ${artist.id} (${artist.name})`);
        return false;
      }

      // 이름 중복 체크 (대소문자 무시)
      const normalizedName = artist.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        const existing = seenNames.get(normalizedName);
        // 이미지가 있는 것을 우선, 둘 다 이미지가 있으면 기존 것 유지
        if (artist.image && !existing.image) {
          seenNames.set(normalizedName, artist);
          seenIds.add(artist.id);
          return true;
        }
        return false;
      }

      seenIds.add(artist.id);
      seenNames.set(normalizedName, artist);
      return true;
    });

    console.log("🎯 uniqueArtists 결과 개수:", result.length);
    return result;
  }, [artists]);

  const uniqueAlbums = useMemo(() => {
    console.log("🔍 uniqueAlbums 생성 - 원본 albums 개수:", albums.length);

    const seenIds = new Set(); // ID 중복 체크
    const seenNames = new Map(); // 이름 -> 최고 품질 앨범 매핑

    const result = albums.filter((album) => {
      // ID 중복 체크
      if (seenIds.has(album.id)) {
        console.log(`❌ ID 중복: ${album.id} (${album.name})`);
        return false;
      }

      // 이름 중복 체크 (대소문자 무시)
      const normalizedName = album.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        const existing = seenNames.get(normalizedName);
        // 더 많은 이미지를 가진 것을 우선
        if (album.images?.length > existing.images?.length) {
          seenNames.set(normalizedName, album);
          seenIds.add(album.id);
          return true;
        }
        return false;
      }

      seenIds.add(album.id);
      seenNames.set(normalizedName, album);
      return true;
    });

    console.log("🎯 uniqueAlbums 결과 개수:", result.length);
    return result;
  }, [albums]);

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

  const handleDropItem = useCallback(
    async (item: DropItem) => {
      if (!session?.user?.id) {
        alert("로그인이 필요합니다.");
        return;
      }

      console.log("handleDropItem called with item:", item);

      // 이미 즐겨찾기에 있는지 확인 (id와 type 모두 체크)
      const existingFavorite = favorites.find(
        (fav) => fav.id === item.id && fav.type === item.type
      );

      if (existingFavorite) {
        console.log("Item already in favorites:", item);
        return;
      }

      try {
        // 데이터베이스에 즐겨찾기 추가
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: item.type,
            spotifyId: item.id,
            name: item.name,
            image: item.image,
          }),
        });

        // 데이터베이스에서 최신 데이터 다시 로드
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setFavorites(data);
            console.log("Favorites refreshed from database:", data);
          }
        }
      } catch (error) {
        console.error("즐겨찾기 추가 오류:", error);
        alert("즐겨찾기 추가에 실패했습니다.");
      }
    },
    [favorites, session?.user?.id]
  );

  const handleArtistFavorite = useCallback(
    async (artist: Artist) => {
      if (!session?.user?.id) {
        alert("로그인이 필요합니다.");
        return;
      }

      // artist.id가 내부 ID인지 확인 (25자)
      if (artist.id.length === 25) {
        console.error("❌ artist.id가 내부 ID입니다:", {
          artistId: artist.id,
          artistIdLength: artist.id.length,
          artistName: artist.name,
        });
        alert("아티스트 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      // artist.id가 Spotify ID인지 확인 (22자)
      if (artist.id.length !== 22) {
        console.error("❌ artist.id가 올바르지 않은 형식입니다:", {
          artistId: artist.id,
          artistIdLength: artist.id.length,
          artistName: artist.name,
        });
        alert("아티스트 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      try {
        console.log("🎯 Adding artist to favorites:", {
          artist: artist,
          artistId: artist.id,
          artistIdType: typeof artist.id,
          artistIdLength: artist.id?.length,
          requestBody: {
            type: "artist",
            spotifyId: artist.id,
            name: artist.name,
            image: artist.image,
          },
        });

        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "artist",
            spotifyId: artist.id,
            name: artist.name,
            image: artist.image,
          }),
        });

        console.log("Add artist response status:", response.status);
        console.log(
          "Add artist response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Add artist response data:", {
            id: data.id,
            spotifyId: data.spotifyId,
            type: data.type,
            name: data.name,
            userId: data.userId,
          });

          // 데이터베이스에서 최신 데이터 다시 로드
          const refreshResponse = await fetch("/api/favorites");
          if (refreshResponse.ok) {
            const refreshData = await response.json();
            if (Array.isArray(refreshData)) {
              setFavorites(refreshData);
              console.log("Favorites refreshed:", refreshData);
            }
          }
        } else {
          console.error("Add artist API error - Status:", response.status);
          console.error(
            "Add artist API error - StatusText:",
            response.statusText
          );

          let errorData;
          try {
            errorData = await response.json();
            console.error("Add artist API error - Response:", errorData);
          } catch (parseError) {
            console.error(
              "Add artist API error - Could not parse response:",
              parseError
            );
            const errorText = await response.text();
            console.error("Add artist API error - Raw response:", errorText);
          }

          alert(`즐겨찾기 추가에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error("아티스트 즐겨찾기 오류:", error);
        alert("즐겨찾기 추가에 실패했습니다.");
      }
    },
    [session?.user?.id]
  );

  const handleAlbumFavorite = useCallback(
    async (album: Album) => {
      if (!session?.user?.id) {
        alert("로그인이 필요합니다.");
        return;
      }

      // album.id가 내부 ID인지 확인 (25자)
      if (album.id.length === 25) {
        console.error("❌ album.id가 내부 ID입니다:", {
          albumId: album.id,
          albumIdLength: album.id.length,
          albumName: album.name,
        });
        alert("앨범 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      // album.id가 Spotify ID인지 확인 (22자)
      if (album.id.length !== 22) {
        console.error("❌ album.id가 올바르지 않은 형식입니다:", {
          albumId: album.id,
          albumIdLength: album.id.length,
          albumName: album.name,
        });
        alert("앨범 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      try {
        console.log("💿 Adding album to favorites:", {
          album: album,
          albumId: album.id,
          albumIdType: typeof album.id,
          albumIdLength: album.id?.length,
          requestBody: {
            type: "album",
            spotifyId: album.id,
            name: album.name,
            image: album.images[0]?.url || "",
          },
        });

        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "album",
            spotifyId: album.id,
            name: album.name,
            image: album.images[0]?.url || "",
          }),
        });

        console.log("Add album response status:", response.status);
        console.log(
          "Add album response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Add album response data:", {
            id: data.id,
            spotifyId: data.spotifyId,
            type: data.type,
            name: data.name,
            userId: data.userId,
          });

          // 데이터베이스에서 최신 데이터 다시 로드
          const refreshResponse = await fetch("/api/favorites");
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (Array.isArray(refreshData)) {
              setFavorites(refreshData);
              console.log("Favorites refreshed:", refreshData);
            }
          }
        } else {
          console.error("Add album API error - Status:", response.status);
          console.error(
            "Add album API error - StatusText:",
            response.statusText
          );

          let errorData;
          try {
            errorData = await response.json();
            console.error("Add album API error - Response:", errorData);
          } catch (parseError) {
            console.error(
              "Add album API error - Could not parse response:",
              parseError
            );
            const errorText = await response.text();
            console.error("Add album API error - Raw response:", errorText);
          }

          alert(`즐겨찾기 추가에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error("앨범 즐겨찾기 오류:", error);
        alert("즐겨찾기 추가에 실패했습니다.");
      }
    },
    [session?.user?.id]
  );

  const [removingFavorites, setRemovingFavorites] = useState<Set<string>>(
    new Set()
  );

  // 수동 새로고침 함수
  const refreshFavorites = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log("🔄 수동 즐겨찾기 새로고침 시작");
      const response = await fetch("/api/favorites");
      console.log("🔄 수동 새로고침 응답 상태:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔄 수동 새로고침 응답 데이터:", data);
        if (Array.isArray(data)) {
          setFavorites(data);
          console.log("✅ 수동 새로고침 완료");
        }
      } else {
        console.error("❌ 수동 새로고침 실패:", response.status);
      }
    } catch (error) {
      console.error("❌ 수동 새로고침 오류:", error);
    }
  }, [session?.user?.id]);

  const removeFavorite = useCallback(
    async (id: string, type: "artist" | "album") => {
      const favoriteKey = `${id}-${type}`;

      // 이미 삭제 중인 경우 중복 실행 방지
      if (removingFavorites.has(favoriteKey)) {
        console.log("⏳ 이미 삭제 중인 즐겨찾기:", favoriteKey);
        return;
      }

      console.log("🚀 removeFavorite 함수 호출됨:", {
        id,
        type,
        sessionUserId: session?.user?.id,
      });

      if (!session?.user?.id) {
        console.error("❌ 세션 사용자 ID 없음");
        alert("로그인이 필요합니다.");
        return;
      }

      // 삭제 중 상태 설정
      setRemovingFavorites((prev) => new Set(prev).add(favoriteKey));

      try {
        console.log("🗑️ 즐겨찾기 제거 시작:", {
          id,
          type,
          userId: session.user.id,
        });

        const requestBody = {
          type,
          spotifyId: id,
        };
        console.log("📤 DELETE 요청 본문:", requestBody);

        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📥 DELETE 응답 상태:", response.status);
        console.log(
          "📥 DELETE 응답 헤더:",
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ 즐겨찾기 제거 성공, 응답 데이터:", data);

          // 즉시 UI에서 해당 아이템 제거 (낙관적 업데이트)
          setFavorites((prev) => {
            console.log("🔍 삭제 전 favorites 데이터:", prev);
            console.log("🔍 삭제하려는 아이템:", { id, type });

            const updated = prev.filter(
              (fav) => !(fav.spotifyId === id && fav.type === type)
            );

            console.log("🔄 즉시 UI 업데이트:", {
              이전개수: prev.length,
              업데이트후개수: updated.length,
              제거된아이템: { id, type },
              필터링조건: `spotifyId !== ${id} || type !== ${type}`,
              삭제전데이터: prev.map((f) => ({
                id: f.id,
                spotifyId: f.spotifyId,
                type: f.type,
                name: f.name,
              })),
              삭제후데이터: updated.map((f) => ({
                id: f.id,
                spotifyId: f.spotifyId,
                type: f.type,
                name: f.name,
              })),
            });
            return updated;
          });

          // 백그라운드 새로고침 비활성화 - 삭제된 데이터가 다시 로드되는 문제 방지
          console.log("🚫 백그라운드 새로고침 비활성화됨 - 데이터 일관성 유지");
        } else {
          const errorData = await response.json();
          console.error("❌ 즐겨찾기 제거 API 오류:", errorData);
          console.error("❌ 응답 상태:", response.status);
          alert(`즐겨찾기 제거에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error("💥 즐겨찾기 제거 중 예외 발생:", error);
        alert("즐겨찾기 제거에 실패했습니다.");
      } finally {
        // 삭제 중 상태 해제
        setRemovingFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(favoriteKey);
          return newSet;
        });
      }
    },
    [session?.user?.id, removingFavorites]
  );

  const handleArtistClick = useCallback((artistId: string) => {
    console.log("🎯 handleArtistClick 호출됨:", {
      artistId: artistId,
      artistIdType: typeof artistId,
      artistIdLength: artistId?.length,
    });

    // Spotify artist ID 형식 검증 (22자리 영숫자)
    const spotifyArtistIdRegex = /^[a-zA-Z0-9]{22}$/;
    if (!spotifyArtistIdRegex.test(artistId)) {
      console.error("❌ Invalid Spotify artist ID format:", artistId);
      alert("올바르지 않은 아티스트 ID입니다. 즐겨찾기를 다시 추가해주세요.");
      return;
    }

    console.log("✅ Spotify artist ID 검증 통과:", artistId);
    setSelectedArtistId(artistId);
    setSelectedAlbum(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  // 즐겨찾기 로드
  useEffect(() => {
    const loadFavorites = async () => {
      if (session?.user?.id) {
        try {
          console.log("Loading favorites for user:", session.user.id);
          const response = await fetch("/api/favorites");
          console.log("Favorites response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Favorites data:", data);
            if (Array.isArray(data)) {
              // 잘못된 형식의 spotifyId를 가진 항목 필터링
              const validData = data.filter((f) => {
                if (f.type === "artist") {
                  const spotifyArtistIdRegex = /^[a-zA-Z0-9]{22}$/;
                  return spotifyArtistIdRegex.test(f.spotifyId);
                }
                return true; // 앨범은 검증하지 않음
              });

              // 잘못된 데이터가 있다면 데이터베이스에서 자동 제거
              const invalidData = data.filter((f) => {
                if (f.type === "artist") {
                  const spotifyArtistIdRegex = /^[a-zA-Z0-9]{22}$/;
                  return !spotifyArtistIdRegex.test(f.spotifyId);
                }
                return false;
              });

              if (invalidData.length > 0) {
                console.log("🚨 잘못된 형식의 데이터 발견:", invalidData);
                // 잘못된 데이터를 데이터베이스에서 제거
                const removePromises = invalidData.map(async (invalidItem) => {
                  try {
                    const deleteResponse = await fetch(
                      `/api/favorites?spotifyId=${invalidItem.spotifyId}&type=${invalidItem.type}`,
                      { method: "DELETE" }
                    );
                    if (deleteResponse.ok) {
                      console.log(
                        `✅ 잘못된 데이터 제거됨: ${invalidItem.name}`
                      );
                      return true;
                    } else {
                      console.error(
                        `❌ 잘못된 데이터 제거 실패: ${invalidItem.name}`
                      );
                      return false;
                    }
                  } catch (error) {
                    console.error(
                      `💥 잘못된 데이터 제거 중 오류: ${invalidItem.name}`,
                      error
                    );
                    return false;
                  }
                });

                // 모든 제거 작업 완료 후 UI 업데이트
                Promise.all(removePromises).then((results) => {
                  const successCount = results.filter(Boolean).length;
                  console.log(
                    `🎉 잘못된 데이터 정리 완료: ${successCount}/${invalidData.length}개 제거됨`
                  );

                  // 성공적으로 제거된 경우에만 UI 업데이트
                  if (successCount > 0) {
                    setFavorites(validData);
                    console.log("✨ UI 업데이트 완료");
                  }
                });
              } else {
                // 잘못된 데이터가 없으면 바로 설정
                setFavorites(validData);
              }

              console.log(
                "🔍 즐겨찾기 데이터 구조:",
                validData.map((f) => ({
                  id: f.id,
                  spotifyId: f.spotifyId,
                  type: f.type,
                  name: f.name,
                }))
              );
            }
          } else {
            const errorData = await response.json();
            console.error("Favorites API error:", errorData);
          }
        } catch (error) {
          console.error("즐겨찾기 로드 오류:", error);
        }
      } else {
        console.log("No session user ID available");
      }
    };

    loadFavorites();
  }, [session?.user?.id]);

  // 검색 쿼리 디바운싱 (빠른 응답)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isComposing) {
        setDebouncedQuery(searchQuery);
      }
    }, 150); // 300ms → 150ms로 단축

    return () => clearTimeout(timer);
  }, [searchQuery, isComposing]);

  // 검색 입력 시 즉시 결과 클리어 (빠른 피드백)
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setAlbums([]);
      setArtists([]);
      setLoading(false);
    }
  }, [searchQuery, debouncedQuery]);

  // 앨범 및 아티스트 데이터 로드 (최적화된 검색)
  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return;

      setLoading(true);

      // 검색어가 변경되면 즉시 이전 결과를 클리어 (빠른 피드백)
      if (debouncedQuery !== searchQuery) {
        setAlbums([]);
        setArtists([]);
        setLoading(false); // 로딩 상태도 즉시 해제
      }

      try {
        const params = new URLSearchParams();
        params.set("query", debouncedQuery);
        if (country) params.set("country", country);
        if (genre) params.set("genre", genre);

        const response = await fetch(
          `/api/spotify/search-or-new-releases?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.albums || []);
          setArtists(data.artists || []);
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery, country, genre, searchQuery]);

  // 즐겨찾기 아티스트 앨범 자동 로드
  useEffect(() => {
    const loadFavoriteArtistAlbums = async () => {
      const favoriteArtists = favorites.filter(
        (item) => item.type === "artist"
      );

      if (favoriteArtists.length > 0 && !searchQuery) {
        try {
          console.log("Loading albums for favorite artists:", favoriteArtists);
          setLoading(true);

          // 즐겨찾기 아티스트들의 이름을 사용하여 검색
          const searchPromises = favoriteArtists.map(async (artist) => {
            try {
              const searchResponse = await fetch(
                `/api/spotify/search-or-new-releases?query=${encodeURIComponent(
                  artist.name
                )}`
              );
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                return searchData.albums || [];
              }
            } catch (error) {
              console.error(`Error loading albums for ${artist.name}:`, error);
            }
            return [];
          });

          const allAlbums = await Promise.all(searchPromises);
          const flatAlbums = allAlbums.flat();

          if (flatAlbums.length > 0) {
            setAlbums(flatAlbums);
          }
        } catch (error) {
          console.error("즐겨찾기 아티스트 앨범 로드 오류:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadFavoriteArtistAlbums();
  }, [favorites, searchQuery]);

  const clearInvalidFavorites = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log("🧹 수동 정리 시작...");

      // 모든 즐겨찾기 데이터 가져오기
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        console.log("📊 현재 즐겨찾기 데이터:", data);

        // 모든 즐겨찾기 데이터를 제거 (강제 정리)
        const invalidData = data;

        console.log("🚨 발견된 잘못된 데이터:", invalidData);

        if (invalidData.length > 0) {
          // 잘못된 데이터 모두 제거
          const removePromises = invalidData.map(
            async (invalidItem: DropItem) => {
              try {
                console.log(
                  `🗑️ 제거 중: ${invalidItem.name} (${invalidItem.spotifyId})`
                );
                const deleteResponse = await fetch(
                  `/api/favorites?spotifyId=${invalidItem.spotifyId}&type=${invalidItem.type}`,
                  { method: "DELETE" }
                );
                if (deleteResponse.ok) {
                  console.log(`✅ 제거 성공: ${invalidItem.name}`);
                  return true;
                } else {
                  console.error(
                    `❌ 제거 실패: ${invalidItem.name} (${deleteResponse.status})`
                  );
                  return false;
                }
              } catch (error) {
                console.error(`💥 제거 중 오류: ${invalidItem.name}`, error);
                return false;
              }
            }
          );

          const results = await Promise.all(removePromises);
          const successCount = results.filter(Boolean).length;

          console.log(
            `🎉 수동 정리 완료: ${successCount}/${invalidData.length}개 제거됨`
          );

          // 즐겨찾기 다시 로드
          const refreshResponse = await fetch("/api/favorites");
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setFavorites(refreshData);
            console.log("✨ 즐겨찾기 새로고침 완료");
          }
        } else {
          console.log("✅ 잘못된 데이터가 없습니다.");
        }
      }
    } catch (error) {
      console.error("💥 즐겨찾기 정리 오류:", error);
    }
  }, [session?.user?.id]);

  // 강제로 모든 즐겨찾기 제거하는 함수
  const forceClearAllFavorites = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log("🧹 강제 정리 시작 - 모든 즐겨찾기 제거...");

      // 현재 즐겨찾기 데이터 가져오기
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        console.log("📊 제거할 즐겨찾기 데이터:", data);

        if (data.length > 0) {
          // 모든 즐겨찾기 제거
          const removePromises = data.map(async (item: DropItem) => {
            try {
              console.log(`🗑️ 강제 제거 중: ${item.name} (${item.spotifyId})`);
              const deleteResponse = await fetch(
                `/api/favorites?spotifyId=${item.spotifyId}&type=${item.type}`,
                { method: "DELETE" }
              );
              if (deleteResponse.ok) {
                console.log(`✅ 강제 제거 성공: ${item.name}`);
                return true;
              } else {
                console.error(
                  `❌ 강제 제거 실패: ${item.name} (${deleteResponse.status})`
                );
                return false;
              }
            } catch (error) {
              console.error(`💥 강제 제거 중 오류: ${item.name}`, error);
              return false;
            }
          });

          const results = await Promise.all(removePromises);
          const successCount = results.filter(Boolean).length;

          console.log(
            `🎉 강제 정리 완료: ${successCount}/${data.length}개 제거됨`
          );

          // 즐겨찾기 상태 초기화
          setFavorites([]);
          console.log("✨ 즐겨찾기 상태 초기화 완료");
        } else {
          console.log("✅ 제거할 즐겨찾기가 없습니다.");
        }
      }
    } catch (error) {
      console.error("💥 강제 정리 오류:", error);
    }
  }, [session?.user?.id]);

  if (status === "loading") return <p>로딩 중...</p>;
  if (!session)
    return (
      <div className="p-4 max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">로그인이 필요합니다</h2>
        <AuthButton />
      </div>
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
        onRemoveFavorite={removeFavorite}
        onRefresh={refreshFavorites}
      />

      {/* 메인 콘텐츠 */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-[320px]" : "ml-0"
        } ${selectedAlbum || selectedArtistId ? "pr-[320px]" : "pr-0"}`}
      >
        {/* 필터 UI */}
        <div
          className={`mb-6 p-6 bg-gradient-to-r ${headerGradient} text-white shadow-sm`}
        >
          <div className="flex justify-between items-center">
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
            <LoginButton />
          </div>
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
              <div className="relative">
                <input
                  type="text"
                  className={`border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-full pr-10 transition-all duration-200 ${
                    loading && searchQuery
                      ? "border-blue-500 shadow-lg shadow-blue-500/20"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="아티스트나 노래 제목 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false);
                    const v = e.currentTarget ? e.currentTarget.value : "";
                    setSearchQuery(v);
                  }}
                />
                {/* 로딩 인디케이터 */}
                {loading && searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
                {/* 검색 상태 표시 */}
                {searchQuery && !loading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="text-blue-500 text-xs font-medium">
                      {uniqueArtists.length + uniqueAlbums.length > 0
                        ? `${uniqueArtists.length + uniqueAlbums.length}개 결과`
                        : "검색 중..."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 검색 결과 표시 */}
        {searchQuery && (
          <div className="px-6 mb-6">
            {/* 로딩 중일 때 스켈레톤 표시 */}
            {loading && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-32 rounded"></div>
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-16 rounded"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-300 dark:bg-gray-600 h-32 rounded-lg"></div>
                      <div className="mt-2 bg-gray-300 dark:bg-gray-600 h-4 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 결과가 있을 때 아티스트와 앨범 표시 */}
            {!loading && (artists.length > 0 || albums.length > 0) && (
              <>
                {/* 검색된 아티스트들 */}
                {artists.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      검색된 아티스트 ({uniqueArtists.length}명)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {uniqueArtists.map((artist, index) => {
                        const key = `artist-${artist.id}-${
                          artist.name
                        }-${index}-${crypto.randomUUID()}`;
                        console.log(
                          `🎨 아티스트 렌더링: ${artist.name} (${artist.id}) - 키: ${key}`
                        );
                        return (
                          <div key={key} className="relative">
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
                              className="group relative rounded-lg overflow-hidden shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-xl"
                            >
                              {artist.image ? (
                                <Image
                                  src={artist.image}
                                  alt={artist.name}
                                  width={300}
                                  height={300}
                                  className="w-full h-32 object-cover transition-all duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">
                                    이미지 없음
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm font-semibold text-center py-2">
                                {artist.name}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("🎯 즐겨찾기 버튼 클릭:", {
                                    artist: artist,
                                    favorites: favorites,
                                    favoritesLength: favorites.length,
                                  });

                                  const isFavorite = favorites.some(
                                    (f) =>
                                      f.spotifyId === artist.id &&
                                      f.type === "artist"
                                  );

                                  console.log("🔍 즐겨찾기 상태 확인:", {
                                    artistId: artist.id,
                                    isFavorite: isFavorite,
                                    matchingFavorites: favorites.filter(
                                      (f) =>
                                        f.spotifyId === artist.id &&
                                        f.type === "artist"
                                    ),
                                  });

                                  if (isFavorite) {
                                    console.log("🗑️ 즐겨찾기 제거 실행");
                                    removeFavorite(artist.id, "artist");
                                  } else {
                                    console.log("❤️ 즐겨찾기 추가 실행");
                                    handleArtistFavorite(artist);
                                  }
                                }}
                                className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                                aria-label="즐겨찾기 토글"
                              >
                                {favorites.some(
                                  (f) =>
                                    f.spotifyId === artist.id &&
                                    f.type === "artist"
                                ) ? (
                                  <svg
                                    className="w-5 h-5 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    />
                                  </svg>
                                ) : (
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
                  </div>
                )}

                {/* 검색된 앨범들 */}
                {albums.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      검색된 앨범 ({uniqueAlbums.length}개)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {uniqueAlbums.map((album, index) => {
                        const key = `album-${album.id}-${
                          album.name
                        }-${index}-${crypto.randomUUID()}`;
                        console.log(
                          `🎵 앨범 렌더링: ${album.name} (${album.id}) - 키: ${key}`
                        );
                        return (
                          <div key={key} className="relative">
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    id: album.id,
                                    name: album.name,
                                    image: album.images[0]?.url || "",
                                    type: "album",
                                  })
                                );
                              }}
                              onClick={() => {
                                const enrichedAlbum = {
                                  ...album,
                                  artists: album.artists.map((artist) => ({
                                    ...artist,
                                    image: "",
                                  })),
                                };
                                setSelectedAlbum(enrichedAlbum);
                                setSelectedArtistId(null);
                              }}
                              className="group relative rounded-lg overflow-hidden shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-xl"
                            >
                              {album.images[0]?.url ? (
                                <Image
                                  src={album.images[0].url}
                                  alt={album.name}
                                  width={300}
                                  height={300}
                                  className="w-full h-32 object-cover transition-all duration-300 hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">
                                    이미지 없음
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm font-semibold text-center py-2 px-2">
                                <div className="truncate">{album.name}</div>
                                <div className="text-xs text-gray-300 truncate">
                                  {album.artists.map((a) => a.name).join(", ")}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isFavorite = favorites.some(
                                    (f) =>
                                      f.id === album.id && f.type === "album"
                                  );
                                  if (isFavorite) {
                                    removeFavorite(album.id, "album");
                                  } else {
                                    handleAlbumFavorite(album);
                                  }
                                }}
                                className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                                aria-label="즐겨찾기 토글"
                              >
                                {favorites.some(
                                  (f) => f.id === album.id && f.type === "album"
                                ) ? (
                                  <svg
                                    className="w-5 h-5 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    />
                                  </svg>
                                ) : (
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
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 검색 결과가 없을 때 안내 */}
        {searchQuery &&
          !loading &&
          uniqueArtists.length === 0 &&
          uniqueAlbums.length === 0 && (
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

        {/* 즐겨찾기 아티스트가 있을 때 아티스트 그리드 표시 (검색 중이 아닐 때) */}
        {favorites.filter((f) => f.type === "artist").length > 0 &&
          !searchQuery && (
            <div className="px-6 mb-6">
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
                    const artistImage = fav.image || "";
                    const artistName = fav.name || "";
                    return (
                      <div
                        key={`favorite-${fav.id}-${
                          fav.spotifyId
                        }-${crypto.randomUUID()}`}
                        className="relative"
                      >
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
                          onClick={() => {
                            console.log("🎯 즐겨찾기 영역에서 아티스트 클릭:", {
                              fav: fav,
                              spotifyId: fav.spotifyId,
                              id: fav.id,
                              type: fav.type,
                              name: fav.name,
                              spotifyIdType: typeof fav.spotifyId,
                              spotifyIdLength: fav.spotifyId?.length,
                              idType: typeof fav.id,
                              idLength: fav.id?.length,
                            });
                            handleArtistClick(fav.spotifyId);
                          }}
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
                              removeFavorite(fav.spotifyId, fav.type);
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
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        {/* 앨범 리스트 - 검색 중이 아닐 때만 표시 */}
        {!searchQuery && (
          <>
            {loading ? (
              <Skeleton variant="album" count={10} />
            ) : (
              <>
                {/* 즐겨찾기 아티스트가 있을 때만 앨범 리스트 표시 */}
                {favorites.filter((f) => f.type === "artist").length > 0 ? (
                  <>
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          즐겨찾기 아티스트 신곡
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {albums.length}개 앨범
                        </span>
                      </div>

                      {loading ? (
                        <Skeleton variant="album" count={5} />
                      ) : albums.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                          {albums.map((album) => {
                            const isFavoriteArtist = album.artists.some(
                              (artist) =>
                                favorites.some(
                                  (fav) =>
                                    fav.type === "artist" &&
                                    fav.spotifyId === artist.id
                                )
                            );

                            return (
                              <div
                                key={`search-album-${
                                  album.id
                                }-${crypto.randomUUID()}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      id: album.id,
                                      name: album.name,
                                      image: album.images?.[0]?.url || "",
                                      type: "album",
                                    })
                                  );
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
                                  setSelectedArtistId(null);
                                }}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer relative"
                              >
                                {/* 즐겨찾기 하트 버튼 */}
                                <div className="absolute top-2 right-2 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlbumFavorite(album);
                                    }}
                                    className="group relative"
                                  >
                                    <div className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm hover:scale-110 transition-transform">
                                      <svg
                                        className={`w-4 h-4 transition-colors ${
                                          favorites.find(
                                            (fav) =>
                                              fav.spotifyId === album.id &&
                                              fav.type === "album"
                                          )
                                            ? "text-red-500 fill-current"
                                            : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                                        }`}
                                        fill={
                                          favorites.find(
                                            (fav) =>
                                              fav.spotifyId === album.id &&
                                              fav.type === "album"
                                          )
                                            ? "currentColor"
                                            : "none"
                                        }
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
                                    </div>
                                  </button>
                                </div>

                                {/* 즐겨찾기 아티스트 표시 */}
                                {isFavoriteArtist && (
                                  <div className="absolute top-2 left-2 z-10">
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
                                      (fav) =>
                                        fav.type === "artist" &&
                                        fav.spotifyId === a.id
                                    );
                                    return (
                                      <span
                                        key={`search-artist-${
                                          a.id
                                        }-${crypto.randomUUID()}`}
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
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">
                            아직 앨범이 로드되지 않았습니다.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 앨범 즐겨찾기 섹션 */}
                    {favorites.filter((f) => f.type === "album").length > 0 && (
                      <div className="px-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            즐겨찾기 앨범
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={clearInvalidFavorites}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                              title="잘못된 데이터 정리"
                            >
                              정리
                            </button>
                            <button
                              onClick={forceClearAllFavorites}
                              className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800 transition"
                              title="모든 즐겨찾기 강제 제거"
                            >
                              강제 정리
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {
                                favorites.filter((f) => f.type === "album")
                                  .length
                              }
                              개 앨범
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                          {favorites
                            .filter((f) => f.type === "album")
                            .map((fav) => (
                              <div
                                key={`favorite-${fav.id}-${
                                  fav.spotifyId
                                }-${crypto.randomUUID()}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      id: fav.id,
                                      name: fav.name,
                                      image: fav.image || "",
                                      type: "album",
                                    })
                                  );
                                }}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer relative"
                              >
                                {/* 즐겨찾기 하트 버튼 */}
                                <div className="absolute top-2 right-2 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFavorite(fav.spotifyId, fav.type);
                                    }}
                                    className="group relative"
                                  >
                                    <div className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm hover:scale-110 transition-transform">
                                      <svg
                                        className="w-4 h-4 text-red-500 fill-current"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                      </svg>
                                    </div>
                                  </button>
                                </div>

                                {fav.image ? (
                                  <Image
                                    src={fav.image}
                                    alt={fav.name}
                                    width={300}
                                    height={300}
                                    className="rounded-md w-full h-auto object-cover"
                                  />
                                ) : (
                                  <div className="w-full aspect-square rounded-md bg-gray-200 dark:bg-gray-700" />
                                )}
                                <h2 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                  {fav.name}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  앨범
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
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
