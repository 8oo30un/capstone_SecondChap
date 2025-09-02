"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AlbumDetailPanel from "./components/AlbumDetailPanel";
import ArtistDetailPanel from "./components/ArtistDetailPanel";

import Skeleton from "./components/Skeleton";
import FavoriteDropZone, { DropItem } from "./components/FavoriteDropZone";
import CyberpunkLogin from "./components/CyberpunkLogin";
import CyberpunkLanding from "./components/CyberpunkLanding";
import Toast, { ToastType } from "./components/Toast";

type Album = {
  id: string; // 내부 ID (25자)
  spotifyId: string; // Spotify ID (22자)
  name: string;
  release_date: string;
  total_tracks?: number;
  album_type?: string;
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
  const [country] = useState("KR");
  const [genre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<DropItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });

  // 토스트 상태
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: "",
    type: "info",
  });

  // 관련 아티스트 상태 제거됨

  // 토스트 표시 함수
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }, []);

  // 토스트 닫기 함수
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

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
          아티스트목록: favoriteArtists.map((a) => ({
            name: a.name,
            id: a.id,
            spotifyId: a.spotifyId,
          })),
        });

        // 진행률 초기화
        setLoadingProgress({
          current: 0,
          total: allArtists.length,
          message: `즐겨찾기 아티스트 ${allArtists.length}명의 앨범을 로드 중...`,
        });

        // 동적 배치 크기로 효율성 향상
        let batchSize = 5; // 초기 배치 크기
        const allAlbums = [];
        let consecutiveErrors = 0; // 연속 에러 카운터
        let totalErrors = 0; // 전체 에러 카운터

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

                // Rate Limit 체크
                if (artistAlbumsData.rateLimitReached) {
                  console.log(`⚠️ ${artist.name}: ${artistAlbumsData.message}`);
                  consecutiveErrors++;
                  totalErrors++;
                  return [];
                }

                const albums = artistAlbumsData.albums || [];

                // 최신 앨범만 로드 (즐겨찾기 아티스트의 신곡)
                const limitedAlbums = albums
                  .sort(
                    (
                      a: { release_date?: string },
                      b: { release_date?: string }
                    ) => {
                      if (!a.release_date || !b.release_date) return 0;
                      const dateA = new Date(a.release_date);
                      const dateB = new Date(b.release_date);
                      return dateB.getTime() - dateA.getTime(); // 최신 날짜부터 정렬
                    }
                  )
                  .slice(0, 10); // 최신 10개 앨범 표시

                console.log(
                  `✅ ${artist.name}의 앨범 ${limitedAlbums.length}개 로드됨:`,
                  limitedAlbums.map(
                    (album: {
                      name: string;
                      release_date?: string;
                      album_type?: string;
                    }) => ({
                      name: album.name,
                      release_date: album.release_date,
                      album_type: album.album_type,
                    })
                  )
                );
                consecutiveErrors = 0; // 성공 시 에러 카운터 리셋
                return limitedAlbums;
              } else {
                console.error(`❌ ${artist.name}의 앨범 로드 실패:`, {
                  status: artistAlbumsResponse.status,
                  statusText: artistAlbumsResponse.statusText,
                  spotifyId: artist.spotifyId,
                  artistName: artist.name,
                });

                // 에러 응답 내용도 확인
                try {
                  const errorData = await artistAlbumsResponse.json();
                  console.error(`에러 상세:`, errorData);

                  // Spotify 토큰 관련 에러인지 확인
                  if (
                    errorData.error === "Failed to get Spotify token" ||
                    errorData.error === "Spotify credentials not configured"
                  ) {
                    console.error(`🔑 Spotify 인증 실패: ${errorData.details}`);
                    // 사용자에게 알림
                    setLoadingProgress({
                      current: 0,
                      total: 0,
                      message: `❌ Spotify API 인증 실패: ${errorData.details}`,
                    });
                  } else if (errorData.error === "Spotify API request failed") {
                    console.error(
                      `🌐 Spotify API 요청 실패: ${errorData.details}`
                    );
                    setLoadingProgress({
                      current: 0,
                      total: 0,
                      message: `❌ Spotify API 오류: ${errorData.details}`,
                    });
                  } else if (
                    errorData.error === "Invalid Spotify artist ID format"
                  ) {
                    console.error(
                      `🆔 잘못된 아티스트 ID 형식: ${errorData.received}`
                    );
                    setLoadingProgress({
                      current: 0,
                      total: 0,
                      message: `❌ 잘못된 아티스트 ID: ${errorData.details}`,
                    });
                  }
                } catch (e) {
                  console.error(`에러 응답 파싱 실패:`, e);
                }

                consecutiveErrors++;
                totalErrors++;
                return [];
              }
            } catch (error) {
              console.error(`Error loading albums for ${artist.name}:`, error);
              consecutiveErrors++;
              totalErrors++;
              return [];
            }
          });

          const batchAlbums = await Promise.all(batchPromises);
          allAlbums.push(...batchAlbums);

          // 진행률 업데이트
          const processedCount = Math.min(i + batchSize, allArtists.length);
          const currentBatch = batch.map((a) => a.name).join(", ");
          setLoadingProgress({
            current: processedCount,
            total: allArtists.length,
            message: `${processedCount}/${allArtists.length} 아티스트 처리 완료 (현재: ${currentBatch})`,
          });

          // 동적 배치 크기 조정: 에러가 많으면 배치 크기 줄임
          if (consecutiveErrors > 3) {
            batchSize = Math.max(1, batchSize - 1);
            console.log(`⚠️ 에러가 많아 배치 크기를 ${batchSize}로 줄임`);
          } else if (consecutiveErrors === 0 && totalErrors < 2) {
            batchSize = Math.min(8, batchSize + 1);
            console.log(`✅ 성공적으로 배치 크기를 ${batchSize}로 늘림`);
          }

          // 스마트 지연 처리: 에러가 많으면 더 오래 대기, 성공하면 빠르게
          if (i + batchSize < allArtists.length) {
            const delay = consecutiveErrors > 2 ? 5000 : 1000; // 에러가 많으면 5초, 성공하면 1초
            console.log(
              `⏳ 다음 배치까지 ${
                delay / 1000
              }초 대기... (연속 에러: ${consecutiveErrors})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        const flatAlbums = allAlbums.flat();

        // Rate Limit 체크
        const rateLimitReached = flatAlbums.some(
          (albums) => albums && Array.isArray(albums) && albums.length === 0
        );

        if (rateLimitReached) {
          console.log("⚠️ 일부 아티스트에서 Rate Limit 발생");
        }

        // 중복 제거 및 출시일 순으로 정렬
        const uniqueAlbums = Array.from(
          new Map(flatAlbums.flat().map((album) => [album.id, album])).values()
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
          앨범목록: uniqueAlbums.slice(0, 10).map((album) => ({
            name: album.name,
            artists: album.artists
              ?.map((a: { name: string }) => a.name)
              .join(", "),
            release_date: album.release_date,
            album_type: album.album_type,
          })),
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

        // 로딩 완료 시 진행률 리셋
        setLoadingProgress({
          current: 0,
          total: 0,
          message: `✅ ${uniqueAlbums.length}개 앨범 로드 완료!`,
        });

        // 3초 후 메시지 제거
        setTimeout(() => {
          setLoadingProgress({ current: 0, total: 0, message: "" });
        }, 3000);
      } catch (error) {
        console.error("즐겨찾기 및 관련 아티스트 앨범 로드 오류:", error);
        setLoadingProgress({
          current: 0,
          total: 0,
          message: "❌ 로딩 중 오류가 발생했습니다",
        });
      } finally {
        setLoading(false);
      }
    }
  }, [favorites, getReleaseDateInfo]);

  // 검색어가 변경될 때마다 검색 결과 정리
  useEffect(() => {
    if (!searchQuery.trim()) {
      setArtists([]);
      setAlbums([]);
      setLoading(false);
      console.log("🧹 검색어 초기화로 검색 결과 정리됨");
    }
  }, [searchQuery]);

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
            showToast(
              `${item.name}이(가) 즐겨찾기에 추가되었습니다!`,
              "success"
            );
          }
        }
      } catch (error) {
        console.error("즐겨찾기 추가 오류:", error);
        showToast("즐겨찾기 추가에 실패했습니다.", "error");
      }
    },
    [favorites, session?.user?.id, showToast]
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
          showToast("즐겨찾기가 새로고침되었습니다.", "success");
        }
      } else {
        console.error("❌ 수동 새로고침 실패:", response.status);
        showToast("즐겨찾기 새로고침에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("❌ 수동 새로고침 오류:", error);
      showToast("즐겨찾기 새로고침에 실패했습니다.", "error");
    }
  }, [session?.user?.id, showToast]);

  const removeFavorite = useCallback(
    async (id: string) => {
      console.log("🔍 removeFavorite 호출됨:", {
        삭제하려는ID: id,
        현재즐겨찾기개수: favorites.length,
      });

      // id에서 실제 spotifyId와 type을 추출
      const favorite = favorites.find((fav) => fav.id === id);
      if (!favorite) {
        console.error("❌ 즐겨찾기 항목을 찾을 수 없음:", id);
        return;
      }

      const { type, spotifyId } = favorite;

      if (!session?.user?.id) {
        console.error("❌ 세션 사용자 ID 없음");
        alert("로그인이 필요합니다.");
        return;
      }

      try {
        const requestBody = {
          type,
          spotifyId: spotifyId,
        };

        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          // 삭제 성공 후 데이터베이스에서 다시 로드
          const refreshResponse = await fetch("/api/favorites");
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (Array.isArray(refreshData)) {
              setFavorites(refreshData);
              showToast(
                `${favorite.name}이(가) 즐겨찾기에서 제거되었습니다.`,
                "success"
              );
            }
          }
        } else {
          showToast("즐겨찾기 제거에 실패했습니다.", "error");
        }
      } catch (error) {
        console.error("즐겨찾기 제거 중 오류:", error);
        showToast("즐겨찾기 제거에 실패했습니다.", "error");
      }
    },
    [session?.user?.id, favorites, showToast]
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
    [favorites, setSelectedArtistId, setSelectedAlbum]
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

  // 검색 쿼리 디바운싱 (Rate Limit 방지를 위해 시간 증가)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isComposing) {
        setDebouncedQuery(searchQuery);
      }
    }, 1000); // 150ms → 1000ms로 증가 (Rate Limit 방지)

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
      // 검색어가 없거나 너무 짧으면 API 호출 안함 (Rate Limit 방지)
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        console.log("🚫 검색어가 너무 짧아 API 호출을 건너뜁니다");
        // 검색어가 없을 때는 기존 앨범 데이터를 클리어하지 않음 (즐겨찾기 아티스트 앨범 유지)
        return;
      }

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

        // 즐겨찾기 아티스트 ID들 전달
        const favoriteArtistIds = favorites
          .filter((item) => item.type === "artist")
          .map((item) => item.spotifyId);
        if (favoriteArtistIds.length > 0) {
          params.set("favoriteArtistIds", favoriteArtistIds.join(","));
        }

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
  }, [debouncedQuery, country, genre, searchQuery, favorites]);

  // 즐겨찾기 아티스트와 관련 아티스트 앨범 자동 로드
  useEffect(() => {
    if (!searchQuery) {
      loadFavoriteAndRelatedAlbums();
    }
  }, [favorites, searchQuery, loadFavoriteAndRelatedAlbums]);

  if (status === "loading") return <p>로딩 중...</p>;
  if (!session) return <CyberpunkLanding />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
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
            className={`mb-6 p-4 sm:p-6 md:p-8 enhanced-cyberpunk-header text-white rounded-2xl backdrop-blur-sm relative overflow-hidden cyberpunk-scanner`}
          >
            {/* 강화된 사이버펑크 그리드 배경 */}
            <div className="absolute inset-0 enhanced-cyberpunk-grid opacity-15"></div>

            {/* 미니멀한 사이버펑크 배경 요소들 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 우측 상단 미묘한 글로우 효과 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/30 to-transparent rounded-full blur-xl"></div>

              {/* 좌측 하단 미묘한 글로우 효과 */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/30 to-transparent rounded-full blur-xl"></div>

              {/* 중앙 미묘한 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-400/10 to-transparent"></div>
            </div>

            <div className="relative z-10">
              {/* 브랜드 로고 영역 - 고급 사이버펑크 스타일 */}
              <div className="text-center mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-cyan-400/50 shadow-2xl shadow-cyan-400/20">
                      <span className="text-3xl md:text-4xl text-cyan-400 font-black tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                        S
                      </span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-2xl blur opacity-60"></div>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black enhanced-main-title tracking-tight">
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center space-x-3">
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
                      <div className="cyberpunk-data mt-3 block">
                        <p className="text-xs sm:text-sm font-mono text-cyan-400 cyberpunk-neon">
                          [SYSTEM] 아티스트를 즐겨찾기에 추가하면 개인 맞춤
                          음악을 추천받을 수 있어요
                        </p>
                      </div>
                    )}

                  {/* 즐겨찾기 아티스트 앨범 로딩 진행률 표시 */}
                  {!searchQuery &&
                    favorites.filter((f) => f.type === "artist").length > 0 &&
                    loading &&
                    loadingProgress.total > 0 && (
                      <div className="cyberpunk-data mt-3 block">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="flex-1 w-full sm:w-auto bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300 shadow-lg shadow-cyan-400/30"
                              style={{
                                width: `${
                                  (loadingProgress.current /
                                    loadingProgress.total) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-mono text-cyan-400 cyberpunk-neon whitespace-nowrap">
                            {loadingProgress.message}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* 사이버펑크 음악 통계 */}
                  <div className="block text-center sm:text-right">
                    <div className="px-3 py-2 sm:px-4 sm:py-3 enhanced-gradient-dark backdrop-blur-sm rounded-xl">
                      <div className="text-xs text-slate-300/80 font-medium tracking-wider uppercase mb-1">
                        Favorite Artists
                      </div>
                      <div className="text-lg sm:text-xl font-bold enhanced-neon-cyan">
                        {favorites.filter((f) => f.type === "artist").length}명
                      </div>
                    </div>
                  </div>
                  <CyberpunkLogin />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  🎵 음악 검색
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative glass-card dark:glass-card-dark p-3 sm:p-4 rounded-xl futuristic-3d neon-glow dark:neon-glow-dark">
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
                        className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 focus:shadow-lg focus:shadow-cyan-400/20 transition-all duration-300 pr-10 sm:pr-12"
                      />
                      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
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
                        onClick={() => {
                          setSearchQuery("");
                          setArtists([]);
                          setAlbums([]);
                          setLoading(false);
                        }}
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
                                {/* 드래그 앤 드롭으로만 즐겨찾기 가능 - 하트 버튼 제거 */}
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
                                {/* 드래그 앤 드롭으로만 즐겨찾기 가능 - 하트 버튼 제거 */}
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
                  onClick={() => {
                    setSearchQuery("");
                    setArtists([]);
                    setAlbums([]);
                    setLoading(false);
                  }}
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
                  <h3 className="text-lg font-bold text-cyan-400">
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
                                    className="w-full h-full object-cover transition-all duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                                )}
                              </div>
                              <div className="absolute bottom-0 w-full bg-black/60 text-white text-xs sm:text-sm font-semibold text-center py-1">
                                {artistName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

          {/* 즐겨찾기 앨범 섹션 - 검색 중이 아닐 때만 표시 */}
          {!searchQuery &&
            favorites.filter((f) => f.type === "album").length > 0 && (
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
                                  release_date: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                  total_tracks: 0,
                                  album_type: "album",
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
                                    },
                                  ],
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
                  {/* 즐겨찾기 아티스트가 있고 검색 중이 아닐 때만 앨범 리스트 표시 */}
                  {!searchQuery &&
                  favorites.filter((f) => f.type === "artist").length > 0 ? (
                    <>
                      <div className="px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold enhanced-favorite-title">
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
                                    {/* 드래그 앤 드롭으로만 즐겨찾기 가능 - 하트 버튼 제거 */}

                                    {/* 즐겨찾기 아티스트 표시 */}
                                    {isFavoriteArtist && (
                                      <div className="absolute top-2 left-2 z-10">
                                        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg border border-emerald-400/30 backdrop-blur-sm shadow-emerald-400/30">
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
                                    <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100">
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
                                                ? "inline-flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                                : ""
                                            }`}
                                          >
                                            {a.name}
                                            {isFavorite && (
                                              <svg
                                                className="w-3 h-3 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]"
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
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50"
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
          album={
            selectedAlbum
              ? {
                  id: selectedAlbum.id,
                  name: selectedAlbum.name,
                  release_date: selectedAlbum.release_date,
                  total_tracks: selectedAlbum.total_tracks || 0,
                  album_type: selectedAlbum.album_type || "album",
                  images: selectedAlbum.images,
                  external_urls: selectedAlbum.external_urls,
                  artists: selectedAlbum.artists,
                }
              : null
          }
          onClose={() => setSelectedAlbum(null)}
        />

        <ArtistDetailPanel
          artistId={selectedArtistId}
          onClose={() => setSelectedArtistId(null)}
        />

        {/* 토스트 메시지 */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      </div>
    </div>
  );
}
