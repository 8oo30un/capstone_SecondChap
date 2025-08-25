"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";
import ArtistDetailPanel from "./components/ArtistDetailPanel";
import dynamic from "next/dynamic";
import Skeleton from "./components/Skeleton";
import { FavoriteDropZone, DropItem } from "./components/FavoriteDropZone";
import CyberpunkLogin from "./components/CyberpunkLogin";
import CyberpunkLanding from "./components/CyberpunkLanding";

const AuthButton = dynamic(() => import("./components/AuthButton"), {
  ssr: false,
});

type Album = {
  id: string; // 내부 ID (25자)
  spotifyId: string; // Spotify ID (22자)
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
};

type Artist = {
  id: string; // 내부 ID (25자)
  spotifyId: string; // Spotify ID (22자)
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
  // 관련 아티스트 상태 제거됨

  // 출시일 계산 함수
  const getReleaseDateInfo = useCallback((releaseDate: string) => {
    if (!releaseDate) {
      return { daysAgo: null, isNew: false, formattedDate: null };
    }

    const release = new Date(releaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - release.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 한달(30일) 이내면 NEW
    const isNew = diffDays <= 30;

    // 한국어 날짜 포맷
    const formattedDate = release.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return { daysAgo: diffDays, isNew, formattedDate };
  }, []);

  // 관련 아티스트 기능 제거 - 즐겨찾기 전용으로 단순화
  const loadCollaborationBasedRecommendations = useCallback(async () => {
    // 이 함수는 더 이상 사용하지 않음
    console.log("ℹ️ 관련 아티스트 기능이 제거되었습니다");
    // 관련 아티스트 설정 제거됨
  }, []);

  // 관련 아티스트 기능 제거됨

  // 즐겨찾기 아티스트들의 앨범 로드 함수 (효율적인 배치 처리)
  const loadFavoriteAndRelatedAlbums = useCallback(async () => {
    const favoriteArtists = favorites.filter((item) => item.type === "artist");
    const allArtists = [...favoriteArtists]; // 관련 아티스트 제거

    if (allArtists.length > 0) {
      try {
        setLoading(true);

        console.log("🎵 앨범 로드 시작:", {
          즐겨찾기아티스트: favoriteArtists.length,
          총아티스트: allArtists.length,
        });

        // 배치 크기를 줄임 (rate limit 방지)
        const batchSize = 2;
        const allAlbums = [];

        for (let i = 0; i < allArtists.length; i += batchSize) {
          const batch = allArtists.slice(i, i + batchSize);

          console.log(
            `📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중: ${batch
              .map((a) => a.name)
              .join(", ")}`
          );

          const batchPromises = batch.map(async (artist) => {
            try {
              console.log(
                `🔍 앨범 로드 시도: ${artist.name} (ID: ${artist.id}, SpotifyID: ${artist.spotifyId})`
              );

              // 아티스트 이름으로 검색하는 대신, Spotify ID를 사용하여 직접 앨범 가져오기
              const artistAlbumsResponse = await fetch(
                `/api/spotify/artist-albums?artistId=${artist.spotifyId}`
              );

              if (artistAlbumsResponse.ok) {
                const artistAlbumsData = await artistAlbumsResponse.json();
                const albums = artistAlbumsData.albums || [];

                // 모든 앨범을 로드 (즐겨찾기 아티스트만)
                const limitedAlbums = albums;

                console.log(
                  `✅ ${artist.name}의 앨범 ${limitedAlbums.length}개 로드됨`
                );
                return limitedAlbums;
              } else {
                console.error(
                  `❌ ${artist.name}의 앨범 로드 실패:`,
                  artistAlbumsResponse.status,
                  `(SpotifyID: ${artist.spotifyId})`
                );

                // 에러 응답 내용도 확인
                try {
                  const errorData = await artistAlbumsResponse.text();
                  console.error(`에러 상세:`, errorData);
                } catch (e) {
                  console.error(`에러 응답 파싱 실패:`, e);
                }

                return [];
              }
            } catch (error) {
              console.error(`Error loading albums for ${artist.name}:`, error);
              return [];
            }
          });

          const batchAlbums = await Promise.all(batchPromises);
          allAlbums.push(...batchAlbums);

          // 배치 간 지연을 늘림 (rate limit 방지)
          if (i + batchSize < allArtists.length) {
            console.log(`⏳ 다음 배치까지 1.5초 대기...`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }

        const flatAlbums = allAlbums.flat();

        // 중복 제거 및 출시일 순으로 정렬
        const uniqueAlbums = Array.from(
          new Map(flatAlbums.map((album) => [album.id, album])).values()
        ).sort((a, b) => {
          if (!a.release_date || !b.release_date) return 0;
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return dateB.getTime() - dateA.getTime(); // 최신 날짜부터 정렬
        });

        console.log("필터링된 앨범:", {
          총앨범수: uniqueAlbums.length,
          아티스트수: allArtists.length,
          아티스트목록: allArtists.map((a) => a.name),
        });

        // NEW 배지 디버깅을 위한 앨범 데이터 확인
        if (uniqueAlbums.length > 0) {
          const sampleAlbum = uniqueAlbums[0];
          const releaseInfo = getReleaseDateInfo(sampleAlbum.release_date);
          console.log(`🔍 샘플 앨범: ${sampleAlbum.name}`, {
            release_date: sampleAlbum.release_date,
            daysAgo: releaseInfo.daysAgo,
            isNew: releaseInfo.isNew,
          });
        }

        setAlbums(uniqueAlbums);
      } catch (error) {
        console.error("즐겨찾기 및 관련 아티스트 앨범 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [favorites, getReleaseDateInfo]);

  // 중복 제거된 고유한 검색 결과 (이름과 ID 모두 고려)
  const uniqueArtists = useMemo(() => {
    console.log("🔍 uniqueArtists 생성 - 원본 artists 개수:", artists.length);

    // Map을 사용하여 ID별로 최고 품질 아티스트 유지
    const artistMap = new Map();
    const duplicateIds = new Set();

    artists.forEach((artist: Artist) => {
      if (artistMap.has(artist.id)) {
        duplicateIds.add(artist.id);
        const existing = artistMap.get(artist.id);
        // 이미지가 있는 것을 우선, 둘 다 이미지가 있으면 기존 것 유지
        if (artist.image && !existing.image) {
          console.log(
            `🔄 uniqueArtists에서 아티스트 업데이트: ${artist.id} (${artist.name}) - 이미지 추가`
          );
          artistMap.set(artist.id, artist);
        } else {
          console.log(
            `❌ uniqueArtists에서 아티스트 ID 중복 제거: ${artist.id} (${artist.name})`
          );
        }
      } else {
        artistMap.set(artist.id, artist);
      }
    });

    // 중복 ID 요약 로그
    if (duplicateIds.size > 0) {
      console.log(
        `⚠️ uniqueArtists에서 중복된 아티스트 ID 발견: ${Array.from(
          duplicateIds
        ).join(", ")}`
      );
    }

    const result = Array.from(artistMap.values());
    console.log("🎯 uniqueArtists 결과 개수:", result.length);
    return result;
  }, [artists]);

  const uniqueAlbums = useMemo(() => {
    console.log("🔍 uniqueAlbums 생성 - 원본 albums 개수:", albums.length);

    // Map을 사용하여 ID별로 최고 품질 앨범 유지
    const albumMap = new Map();
    const duplicateIds = new Set();

    albums.forEach((album: Album) => {
      if (albumMap.has(album.id)) {
        duplicateIds.add(album.id);
        const existing = albumMap.get(album.id);

        // 동일한 ID의 앨범이 여러 번 나타나는 경우만 제거
        // 서로 다른 앨범은 ID가 같아도 유지
        if (album.name === existing.name) {
          // 더 많은 이미지를 가진 것을 우선
          if ((album.images?.length || 0) > (existing.images?.length || 0)) {
            console.log(
              `🔄 uniqueAlbums에서 앨범 업데이트: ${album.id} (${album.name}) - 더 많은 이미지`
            );
            albumMap.set(album.id, album);
          } else {
            console.log(
              `❌ uniqueAlbums에서 동일한 앨범 ID 중복 제거: ${album.id} (${album.name})`
            );
          }
        } else {
          // 서로 다른 앨범이지만 ID가 같은 경우 - 유지
          console.log(
            `⚠️ uniqueAlbums에서 다른 앨범이지만 ID가 같은 경우: ${album.id} (${album.name}) vs ${existing.name}`
          );
          // 기존 앨범과 새 앨범을 모두 유지 (ID에 인덱스 추가)
          albumMap.set(`${album.id}_1`, existing);
          albumMap.set(`${album.id}_2`, album);
        }
      } else {
        albumMap.set(album.id, album);
      }
    });

    // 중복 ID 요약 로그
    if (duplicateIds.size > 0) {
      console.log(
        `⚠️ uniqueAlbums에서 중복된 앨범 ID 발견: ${Array.from(
          duplicateIds
        ).join(", ")}`
      );
    }

    const result = Array.from(albumMap.values());
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
            spotifyId: item.spotifyId || item.id, // spotifyId가 있으면 사용, 없으면 id 사용
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

      // artist.spotifyId가 내부 ID인지 확인 (25자)
      if (artist.spotifyId.length === 25) {
        console.error("❌ artist.spotifyId가 내부 ID입니다:", {
          artistSpotifyId: artist.spotifyId,
          artistSpotifyIdLength: artist.spotifyId.length,
          artistName: artist.name,
        });
        alert("아티스트 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      // artist.spotifyId가 Spotify ID인지 확인 (22자)
      if (artist.spotifyId.length !== 22) {
        console.error("❌ artist.spotifyId가 올바르지 않은 형식입니다:", {
          artistSpotifyId: artist.spotifyId,
          artistSpotifyIdLength: artist.spotifyId.length,
          artistName: artist.name,
        });
        alert("아티스트 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
        return;
      }

      try {
        console.log("🎯 Adding artist to favorites:", {
          artist: artist,
          artistSpotifyId: artist.spotifyId,
          artistSpotifyIdType: typeof artist.spotifyId,
          artistSpotifyIdLength: artist.spotifyId?.length,
          requestBody: {
            type: "artist",
            spotifyId: artist.spotifyId,
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
            spotifyId: artist.spotifyId,
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
            const refreshData = await refreshResponse.json();
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

      // album.id가 존재하는지 확인
      if (!album.id) {
        console.error("❌ album.id가 없습니다:", {
          album: album,
          albumName: album.name,
        });
        alert("앨범 정보가 올바르지 않습니다. 검색을 다시 시도해주세요.");
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
        // 이미지 URL을 안전하게 가져오기
        const imageUrl =
          album.images && Array.isArray(album.images) && album.images.length > 0
            ? album.images[0].url
            : "";

        const requestBody = {
          type: "album",
          spotifyId: album.id,
          name: album.name,
          image: imageUrl,
        };

        console.log("💿 Adding album to favorites:", {
          album: album,
          albumId: album.id,
          albumIdType: typeof album.id,
          albumIdLength: album.id?.length,
          requestBody: requestBody,
        });

        console.log("📤 전송할 데이터:", JSON.stringify(requestBody, null, 2));

        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
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
          console.error("❌ Add album API error - Status:", response.status);
          console.error(
            "❌ Add album API error - StatusText:",
            response.statusText
          );

          let errorData;
          try {
            errorData = await response.json();
            console.error("❌ Add album API error - Response:", errorData);

            // 에러 메시지가 있으면 사용자에게 표시
            if (errorData && errorData.error) {
              alert(`즐겨찾기 추가 실패: ${errorData.error}`);
            } else {
              alert(`즐겨찾기 추가에 실패했습니다. (${response.status})`);
            }
          } catch (parseError) {
            console.error(
              "❌ Add album API error - Could not parse response:",
              parseError
            );
            const errorText = await response.text();
            console.error("❌ Add album API error - Raw response:", errorText);
            alert(`즐겨찾기 추가에 실패했습니다. (${response.status})`);
          }
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

  const handleArtistClick = useCallback(
    (artistId: string) => {
      console.log("🎯 handleArtistClick 호출됨:", {
        artistId: artistId,
        artistIdType: typeof artistId,
        artistIdLength: artistId?.length,
      });

      // 내부 ID인 경우 (25자) - 즐겨찾기에서 spotifyId 찾기
      if (artistId.length === 25) {
        console.log("🔍 내부 ID 감지됨, 즐겨찾기에서 spotifyId 찾는 중...");

        const favoriteArtist = favorites.find(
          (fav) => fav.id === artistId && fav.type === "artist"
        );

        if (favoriteArtist && favoriteArtist.spotifyId) {
          console.log("✅ 즐겨찾기에서 spotifyId 찾음:", {
            internalId: artistId,
            spotifyId: favoriteArtist.spotifyId,
            name: favoriteArtist.name,
          });

          // Spotify ID로 계속 진행
          artistId = favoriteArtist.spotifyId;
        } else {
          console.error("❌ 즐겨찾기에서 spotifyId를 찾을 수 없음:", {
            internalId: artistId,
            favorites: favorites.filter((f) => f.type === "artist"),
          });
          alert(
            "아티스트 정보를 찾을 수 없습니다. 즐겨찾기를 다시 추가해주세요."
          );
          return;
        }
      }

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

      // 관련 아티스트 기능이 제거되었으므로 이 부분은 비활성화
      // loadCollaborationBasedRecommendations();
    },
    [favorites]
  );

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

          console.log(
            `📊 API 원본 결과: 아티스트 ${data.artists?.length || 0}개, 앨범 ${
              data.albums?.length || 0
            }개`
          );

          // 중복 제거를 위한 Map 사용 (최신/최고 품질 결과 유지)
          const artistMap = new Map();
          const albumMap = new Map();

          console.log(
            `🔍 중복 제거 시작 - 아티스트: ${
              data.artists?.length || 0
            }개, 앨범: ${data.albums?.length || 0}개`
          );

          // 중복 ID 추적을 위한 Set
          const duplicateArtistIds = new Set();
          const duplicateAlbumIds = new Set();

          // artists 중복 제거 및 최고 품질 결과 유지
          (data.artists || []).forEach(
            (artist: { id: string; name: string; image?: string }) => {
              if (artistMap.has(artist.id)) {
                duplicateArtistIds.add(artist.id);
                const existing = artistMap.get(artist.id);
                // 이미지가 있는 것을 우선, 둘 다 이미지가 있으면 기존 것 유지
                if (artist.image && !existing.image) {
                  console.log(
                    `🔄 아티스트 업데이트: ${artist.id} (${artist.name}) - 이미지 추가`
                  );
                  artistMap.set(artist.id, artist);
                } else {
                  console.log(
                    `🔍 아티스트 중복 제거: ${artist.id} (${artist.name})`
                  );
                }
              } else {
                artistMap.set(artist.id, artist);
              }
            }
          );

          // albums 중복 제거 및 최고 품질 결과 유지
          (data.albums || []).forEach(
            (album: {
              id: string;
              name: string;
              images?: { url: string; width: number; height: number }[];
              release_date?: string;
              external_urls?: { spotify: string };
              artists?: { id: string; name: string }[];
            }) => {
              if (albumMap.has(album.id)) {
                duplicateAlbumIds.add(album.id);
                const existing = albumMap.get(album.id);
                // 더 많은 이미지를 가진 것을 우선
                if (
                  (album.images?.length || 0) > (existing.images?.length || 0)
                ) {
                  console.log(
                    `🔄 앨범 업데이트: ${album.id} (${album.name}) - 더 많은 이미지`
                  );
                  albumMap.set(album.id, album);
                } else {
                  console.log(`🔍 앨범 중복 제거: ${album.id} (${album.name})`);
                }
              } else {
                albumMap.set(album.id, album);
              }
            }
          );

          // 중복 ID 요약 로그
          if (duplicateArtistIds.size > 0) {
            console.log(
              `⚠️ 중복된 아티스트 ID 발견: ${Array.from(
                duplicateArtistIds
              ).join(", ")}`
            );
          }
          if (duplicateAlbumIds.size > 0) {
            console.log(
              `⚠️ 중복된 앨범 ID 발견: ${Array.from(duplicateAlbumIds).join(
                ", "
              )}`
            );
          }

          console.log(
            `✅ 중복 제거 완료 - 아티스트: ${artistMap.size}개, 앨범: ${albumMap.size}개`
          );

          // Map에서 값만 추출하여 배열로 변환
          const artistsWithSpotifyId = Array.from(artistMap.values()).map(
            (artist) => ({
              ...artist,
              spotifyId: artist.id, // Spotify API의 id를 spotifyId로 매핑
            })
          );

          const albumsWithSpotifyId = Array.from(albumMap.values()).map(
            (album) => ({
              ...album,
              spotifyId: album.id, // Spotify API의 id를 spotifyId로 매핑
            })
          );

          console.log(
            `🎯 API 결과 중복 제거 후: 아티스트 ${artistsWithSpotifyId.length}개, 앨범 ${albumsWithSpotifyId.length}개`
          );

          // 중복 제거된 결과를 상태에 설정
          setAlbums(albumsWithSpotifyId);
          setArtists(artistsWithSpotifyId);
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery, country, genre, searchQuery]);

  // 즐겨찾기 아티스트와 관련 아티스트 앨범 자동 로드
  useEffect(() => {
    if (!searchQuery) {
      loadFavoriteAndRelatedAlbums();
      // 협업 기반 추천은 수동으로만 로드 (자동 로드 비활성화)
      // if (favorites.filter((f) => f.type === "artist").length > 0) {
      //   loadCollaborationBasedRecommendations();
      // }
    }
  }, [
    favorites,
    searchQuery,
    loadFavoriteAndRelatedAlbums,
    // loadCollaborationBasedRecommendations, // 자동 로드 비활성화
  ]);

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
  if (!session) return <CyberpunkLanding />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-12">
        {/* 음표 배경 패턴 */}
        <div className="music-notes-bg dark:music-notes-bg-dark absolute inset-0 pointer-events-none"></div>

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
          className={`flex-1 transition-all duration-300 relative z-10 ${
            isSidebarOpen ? "ml-[320px]" : "ml-0"
          } ${selectedAlbum || selectedArtistId ? "pr-[320px]" : "pr-0"}`}
        >
          {/* 필터 UI */}
          <div
            className={`mb-6 p-8 enhanced-cyberpunk-header text-white rounded-2xl backdrop-blur-sm relative overflow-hidden cyberpunk-scanner`}
          >
            {/* 강화된 사이버펑크 그리드 배경 */}
            <div className="absolute inset-0 enhanced-cyberpunk-grid opacity-15"></div>

            {/* 미니멀한 사이버펑크 배경 요소들 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 우측 상단 미묘한 글로우 효과 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/20 to-transparent rounded-full blur-xl"></div>

              {/* 좌측 하단 미묘한 글로우 효과 */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-magenta-400/20 to-transparent rounded-full blur-xl"></div>

              {/* 중앙 미묘한 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-400/5 to-transparent"></div>
            </div>

            <div className="relative z-10">
              {/* 브랜드 로고 영역 - 고급 사이버펑크 스타일 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-6 mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-cyan-400/30 shadow-2xl">
                      <span className="text-4xl text-cyan-400 font-black tracking-wider">
                        S
                      </span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-2xl blur opacity-40"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <h1 className="text-6xl md:text-7xl font-black enhanced-main-title tracking-tight">
                      SecondChap
                    </h1>
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 enhanced-platform-badge rounded-lg mt-2">
                      <div className="w-1 h-1 bg-cyan-400/60 rounded-full"></div>
                      <p className="text-xs font-mono text-slate-300/70 tracking-widest uppercase">
                        Music Discovery Platform
                      </p>
                      <div className="w-1 h-1 bg-cyan-400/60 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 메인 제목 영역 - 사이버펑크 스타일 */}
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center space-x-3">
                    {/* <span className="text-4xl cyberpunk-neon-cyan">🎧</span> */}
                    <span className="enhanced-neon-cyan">
                      {searchQuery
                        ? `"${searchQuery}" 검색 결과`
                        : favorites.filter((f) => f.type === "artist").length >
                          0
                        ? "즐겨찾기 아티스트 신곡"
                        : "음악 탐색을 시작하세요"}
                    </span>
                  </h2>
                  {!searchQuery &&
                    favorites.filter((f) => f.type === "artist").length ===
                      0 && (
                      <div className="cyberpunk-data mt-3 inline-block">
                        <p className="text-sm font-mono text-cyan-400 cyberpunk-neon">
                          [SYSTEM] 아티스트를 즐겨찾기에 추가하면 개인 맞춤
                          음악을 추천받을 수 있어요
                        </p>
                      </div>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                  {/* 사이버펑크 음악 통계 */}
                  <div className="hidden md:block text-right">
                    <div className="px-4 py-3 enhanced-gradient-dark backdrop-blur-sm rounded-xl">
                      <div className="text-xs text-slate-300/80 font-medium tracking-wider uppercase mb-1">
                        Favorite Artists
                      </div>
                      <div className="text-xl font-bold enhanced-neon-cyan">
                        {favorites.filter((f) => f.type === "artist").length}명
                      </div>
                    </div>
                  </div>
                  <CyberpunkLogin />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  🎵 음악 검색
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative glass-card dark:glass-card-dark p-4 rounded-xl futuristic-3d neon-glow dark:neon-glow-dark">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="아티스트, 앨범, 곡명으로 검색해보세요..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false);
                          const v = e.currentTarget
                            ? e.currentTarget.value
                            : "";
                          setSearchQuery(v);
                        }}
                        className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 rounded-lg px-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 pr-12"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      {/* 로딩 인디케이터 */}
                      {loading && searchQuery && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                      {/* 검색 상태 표시 */}
                      {searchQuery && !loading && (
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                          <div className="text-blue-500 text-xs font-medium">
                            {uniqueArtists.length + uniqueAlbums.length > 0
                              ? `${
                                  uniqueArtists.length + uniqueAlbums.length
                                }개 결과`
                              : "검색 중..."}
                          </div>
                        </div>
                      )}
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-3 futuristic-btn px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 hover:scale-105 neon-glow dark:neon-glow-dark"
                      >
                        검색 초기화
                      </button>
                    )}
                  </div>
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
                                      spotifyId: artist.id, // Spotify ID 추가
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
                                  className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-300 ${
                                    favorites.some(
                                      (f) =>
                                        f.spotifyId === artist.id &&
                                        f.type === "artist"
                                    )
                                      ? "enhanced-heart-button"
                                      : "enhanced-heart-button-unfilled"
                                  }`}
                                  aria-label="즐겨찾기 토글"
                                >
                                  {favorites.some(
                                    (f) =>
                                      f.spotifyId === artist.id &&
                                      f.type === "artist"
                                  ) ? (
                                    <svg
                                      className="w-5 h-5 text-white"
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
                                onClick={async () => {
                                  try {
                                    // 즐겨찾기 앨범 클릭 시 Spotify API를 통해 실제 앨범 정보 가져오기
                                    if (album.spotifyId) {
                                      const response = await fetch(
                                        `/api/spotify/album?id=${album.spotifyId}`
                                      );
                                      if (response.ok) {
                                        const albumData = await response.json();
                                        setSelectedAlbum(albumData);
                                        setSelectedArtistId(null);
                                      } else {
                                        console.error(
                                          "앨범 정보를 가져올 수 없습니다."
                                        );
                                      }
                                    } else {
                                      // spotifyId가 없는 경우 기본 정보로 표시
                                      const enrichedAlbum = {
                                        id: album.id || "",
                                        spotifyId: album.id || "",
                                        name: album.name || "앨범명 없음",
                                        images: album.images
                                          ? [
                                              {
                                                url: album.images[0].url,
                                                width: 200,
                                                height: 200,
                                              },
                                            ]
                                          : [],
                                        artists: [
                                          {
                                            id: "",
                                            name: "알 수 없는 아티스트",
                                            image: "",
                                          },
                                        ],
                                        release_date: "",
                                        total_tracks: 0,
                                        external_urls: { spotify: "" },
                                        tracks: { items: [] },
                                      };
                                      setSelectedAlbum(enrichedAlbum);
                                      setSelectedArtistId(null);
                                    }
                                  } catch (error) {
                                    console.error(
                                      "즐겨찾기 앨범 클릭 에러:",
                                      error
                                    );
                                  }
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
                                    {album.artists
                                      .map(
                                        (a: { id: string; name: string }) =>
                                          a.name
                                      )
                                      .join(", ")}
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
                                  className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-300 ${
                                    favorites.some(
                                      (f) =>
                                        f.id === album.id && f.type === "album"
                                    )
                                      ? "enhanced-heart-button"
                                      : "enhanced-heart-button-unfilled"
                                  }`}
                                  aria-label="즐겨찾기 토글"
                                >
                                  {favorites.some(
                                    (f) =>
                                      f.id === album.id && f.type === "album"
                                  ) ? (
                                    <svg
                                      className="w-5 h-5 text-white"
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
              <div className="text-center py-8 glass-card dark:glass-card-dark p-8 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 text-blue-400 dark:text-blue-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white dark:text-gray-200 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-200 dark:text-gray-400 mb-4">
                  다른 키워드로 검색해보세요
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 futuristic-btn text-white rounded-lg transition-all duration-300 neon-glow dark:neon-glow-dark"
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
                  <h3 className="text-lg font-semibold text-cyan-400 font-bold">
                    🎤 즐겨찾기 아티스트
                  </h3>
                  <span className="text-sm text-slate-400">
                    {favorites.filter((f) => f.type === "artist").length}명
                  </span>
                </div>
                <div className="enhanced-gradient-artist backdrop-blur-sm p-4 rounded-xl">
                  {/* 아티스트 그리드 - 반응형 그리드 */}
                  <div
                    id="favorite-artists-container"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                  >
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
                                console.log(
                                  "🎯 즐겨찾기 영역에서 아티스트 클릭:",
                                  {
                                    fav: fav,
                                    spotifyId: fav.spotifyId,
                                    id: fav.id,
                                    type: fav.type,
                                    name: fav.name,
                                    spotifyIdType: typeof fav.spotifyId,
                                    spotifyIdLength: fav.spotifyId?.length,
                                    idType: typeof fav.id,
                                    idLength: fav.id?.length,
                                  }
                                );
                                handleArtistClick(fav.id);
                              }}
                              className="group relative rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 w-full enhanced-favorite-card transition-all duration-300"
                            >
                              <div className="enhanced-artist-image-container w-full h-20 sm:h-24">
                                {artistImage ? (
                                  <Image
                                    src={artistImage}
                                    alt={artistName}
                                    width={120}
                                    height={96}
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:brightness-75"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                                )}
                              </div>
                              <div className="absolute bottom-0 w-full bg-black/60 text-white text-xs sm:text-sm font-semibold text-center py-1">
                                {artistName}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFavorite(fav.spotifyId, fav.type);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm hover:scale-110 transition-transform z-10"
                                aria-label="즐겨찾기 해제"
                              >
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
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

          {/* 즐겨찾기 앨범 섹션 - 아티스트 바로 밑에 표시 */}
          {favorites.filter((f) => f.type === "album").length > 0 && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">
                  💿 즐겨찾기 앨범
                </h3>
                <span className="text-sm text-slate-400">
                  {favorites.filter((f) => f.type === "album").length}개 앨범
                </span>
              </div>
              <div className="w-full enhanced-gradient-album backdrop-blur-sm p-4 rounded-xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
                        onClick={async () => {
                          try {
                            // 즐겨찾기 앨범 클릭 시 Spotify API를 통해 실제 앨범 정보 가져오기
                            if (fav.spotifyId) {
                              const response = await fetch(
                                `/api/spotify/album?id=${fav.spotifyId}`
                              );
                              if (response.ok) {
                                const albumData = await response.json();
                                setSelectedAlbum(albumData);
                                setSelectedArtistId(null);
                              } else {
                                console.error(
                                  "앨범 정보를 가져올 수 없습니다."
                                );
                              }
                            } else {
                              // spotifyId가 없는 경우 기본 정보로 표시
                              const enrichedAlbum = {
                                id: fav.id || "",
                                spotifyId: fav.id || "",
                                name: fav.name || "앨범명 없음",
                                images: fav.image
                                  ? [
                                      {
                                        url: fav.image,
                                        width: 200,
                                        height: 200,
                                      },
                                    ]
                                  : [],
                                artists: [
                                  {
                                    id: "",
                                    name: "알 수 없는 아티스트",
                                    image: "",
                                  },
                                ],
                                release_date: "",
                                total_tracks: 0,
                                external_urls: { spotify: "" },
                                tracks: { items: [] },
                              };
                              setSelectedAlbum(enrichedAlbum);
                              setSelectedArtistId(null);
                            }
                          } catch (error) {
                            console.error("즐겨찾기 앨범 클릭 에러:", error);
                          }
                        }}
                        className="enhanced-favorite-card backdrop-blur-sm rounded-lg p-3 flex flex-col cursor-pointer relative hover:bg-slate-700/80 transition-all duration-300 hover:scale-105"
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

                        <div className="enhanced-album-image-container w-full aspect-square">
                          {fav.image ? (
                            <Image
                              src={fav.image}
                              alt={fav.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                          )}
                        </div>
                        <h2 className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {fav.name}
                        </h2>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 관련 아티스트 섹션 제거됨 - 즐겨찾기 전용으로 단순화 */}

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
                          <h3 className="text-lg font-semibold enhanced-favorite-title font-bold">
                            🎵 즐겨찾기 아티스트 신곡
                          </h3>
                          <span className="text-sm text-slate-400">
                            {albums.length}개 앨범 (출시일 순)
                          </span>
                        </div>

                        {loading ? (
                          <Skeleton variant="album" count={5} />
                        ) : albums.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                            {albums
                              .sort((a, b) => {
                                if (!a.release_date || !b.release_date)
                                  return 0;
                                const dateA = new Date(a.release_date);
                                const dateB = new Date(b.release_date);
                                return dateB.getTime() - dateA.getTime(); // 최신 날짜부터 정렬
                              })
                              .map((album) => {
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
                                          spotifyId: album.id, // Spotify ID 추가
                                          name: album.name,
                                          image: album.images?.[0]?.url || "",
                                          type: "album",
                                        })
                                      );
                                    }}
                                    onClick={() => {
                                      const enrichedAlbum = {
                                        ...album,
                                        artists: album.artists.map(
                                          (artist: {
                                            id: string;
                                            name: string;
                                          }) => ({
                                            ...artist,
                                            image: "",
                                          })
                                        ),
                                      };
                                      setSelectedAlbum(enrichedAlbum);
                                      setSelectedArtistId(null);
                                    }}
                                    className="enhanced-favorite-card backdrop-blur-sm rounded-lg p-3 flex flex-col cursor-pointer relative hover:bg-slate-700/80 transition-all duration-300"
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

                                    {/* NEW 배지 및 출시일 정보 */}
                                    {album.release_date && (
                                      <div className="absolute top-2 left-2 z-10">
                                        {(() => {
                                          const releaseInfo =
                                            getReleaseDateInfo(
                                              album.release_date
                                            );

                                          // 30일 이내 출시된 앨범에만 NEW 배지 표시
                                          if (releaseInfo.isNew) {
                                            console.log(
                                              `🆕 NEW 배지 표시: ${album.name} (${releaseInfo.daysAgo}일 전)`
                                            );
                                            return (
                                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg border border-white/20 backdrop-blur-sm">
                                                <div className="flex items-center gap-1">
                                                  <svg
                                                    className="w-3 h-3"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                  <span>NEW</span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          // 30일 초과된 앨범도 로그로 확인
                                          if (
                                            releaseInfo.daysAgo &&
                                            releaseInfo.daysAgo > 30
                                          ) {
                                            console.log(
                                              `📅 오래된 앨범: ${album.name} (${releaseInfo.daysAgo}일 전)`
                                            );
                                          }

                                          return null;
                                        })()}
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
                                    <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100 font-bold">
                                      {album.name}
                                    </h2>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
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

                                    {/* 출시일 정보 */}
                                    {album.release_date && (
                                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-500">
                                        {(() => {
                                          const releaseInfo =
                                            getReleaseDateInfo(
                                              album.release_date
                                            );
                                          if (releaseInfo.daysAgo !== null) {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <svg
                                                  className="w-3 h-3 text-gray-400"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                                <span>
                                                  {releaseInfo.formattedDate}
                                                </span>
                                                <span className="text-gray-400">
                                                  •
                                                </span>
                                                <span>
                                                  {releaseInfo.daysAgo === 0
                                                    ? "오늘 출시"
                                                    : releaseInfo.daysAgo === 1
                                                    ? "어제 출시"
                                                    : `${releaseInfo.daysAgo}일 전 출시`}
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    )}

                                    <a
                                      href={album.external_urls.spotify}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 px-4 py-2 text-sm font-semibold text-white enhanced-play-button rounded-lg transition-all duration-300"
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

                      {/* 앨범 즐겨찾기 섹션은 즐겨찾기 아티스트 바로 밑으로 이동됨 */}
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
                          위에서 좋아하는 아티스트를 검색하고 즐겨찾기에
                          추가하면,
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
    </div>
  );
}
