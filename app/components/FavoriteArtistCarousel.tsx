"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
// 타입 정의
type Album = {
  id: string;
  spotifyId: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  images?: Array<{
    url: string;
  }>;
  release_date?: string;
  album_type?: string;
  total_tracks?: number;
};

type DropItem = {
  id: string;
  spotifyId: string;
  name: string;
  type: "artist" | "album";
  image?: string;
};

interface FavoriteArtistCarouselProps {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
  favorites: DropItem[];
  getReleaseDateInfo: (releaseDate: string) => {
    formattedDate: string | null;
    isNew: boolean;
  };
  loading?: boolean;
  onDragStart?: (e: React.DragEvent, album: Album) => void;
}

export default function FavoriteArtistCarousel({
  albums,
  onAlbumClick,
  favorites,
  getReleaseDateInfo,
  loading = false,
  onDragStart,
}: FavoriteArtistCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isCarouselMode, setIsCarouselMode] = useState(true);

  // 반응형으로 보여줄 카드 개수 계산
  const getVisibleCards = () => {
    if (typeof window === "undefined") return 6;

    const width = window.innerWidth;
    if (width < 640) return 2; // sm
    if (width < 768) return 3; // md
    if (width < 1024) return 4; // lg
    if (width < 1280) return 5; // xl
    return 6; // 2xl
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards());

  // 윈도우 리사이즈 이벤트 리스너
  React.useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.max(1, Math.ceil(albums.length / visibleCards));

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    // 카드 클릭을 방해하지 않도록 카드가 아닌 영역에서만 드래그 시작
    if ((e.target as HTMLElement).closest(".enhanced-favorite-card")) {
      return;
    }

    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // 드래그 거리에 따라 슬라이드 변경
    const threshold = 100;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    }

    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);

    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startX;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // 드래그 거리에 따라 슬라이드 변경
    const threshold = 100;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    }

    setDragOffset(0);
  };

  const renderAlbumCard = (album: Album) => {
    const keyPrefix = "carousel";

    return (
      <div
        key={`${keyPrefix}-${album.id}-${crypto.randomUUID()}`}
        draggable={true}
        onDragStart={(e) => {
          if (onDragStart) {
            onDragStart(e, album);
          }
        }}
        onClick={() => {
          console.log("🎵 캐러셀 카드 클릭:", album.name);
          onAlbumClick(album);
        }}
        className="enhanced-favorite-card backdrop-blur-sm rounded-lg p-4 flex flex-col cursor-pointer relative transition-all duration-300 group hover:bg-slate-700/80 hover:scale-105"
      >
        {/* NEW 배지 및 출시일 정보 */}
        {album.release_date && (
          <div className="absolute top-2 left-2 z-10">
            {(() => {
              const releaseInfo = getReleaseDateInfo(album.release_date);

              // 30일 이내 출시된 앨범에만 NEW 배지 표시
              if (releaseInfo.isNew) {
                return (
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg border border-white/20 backdrop-blur-sm">
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
              return null;
            })()}
          </div>
        )}

        {/* 즐겨찾기 표시 */}
        {(() => {
          const albumFavorites = favorites.filter(
            (fav) => fav.type === "album"
          );

          // ID 매칭을 더 유연하게 처리
          const isFavorite = albumFavorites.some((fav) => {
            // fav.id와 album.id가 정확히 일치하거나
            // fav.spotifyId와 album.spotifyId가 일치하는지 확인
            return (
              fav.id === album.id ||
              fav.spotifyId === album.spotifyId ||
              fav.id === album.spotifyId
            );
          });

          console.log("🎵 즐겨찾기 체크:", {
            albumId: album.id,
            albumSpotifyId: album.spotifyId,
            albumName: album.name,
            albumFavorites: albumFavorites,
            favoriteIds: albumFavorites.map((fav) => ({
              id: fav.id,
              spotifyId: fav.spotifyId,
            })),
            isFavorite,
            allFavorites: favorites,
          });

          return isFavorite;
        })() && (
          <div
            className="absolute top-2 right-2 z-20"
            style={{ top: "8px", right: "8px" }}
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg border border-red-400/30 backdrop-blur-sm">
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

        <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100">
          {album.name}
        </h2>

        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          {album.artists.map((a: { id: string; name: string }) => {
            const isFavorite = favorites.some(
              (fav) => fav.type === "artist" && fav.spotifyId === a.id
            );
            return (
              <span
                key={`${keyPrefix}-artist-${a.id}-${crypto.randomUUID()}`}
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
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            );
          })}
        </p>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {album.release_date && (
            <span>
              {getReleaseDateInfo(album.release_date).formattedDate} •{" "}
            </span>
          )}
          <span className="capitalize">{album.album_type}</span>
          {album.total_tracks && <span> • {album.total_tracks}곡</span>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative">
        {/* 모드 토글 버튼 */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
            <button
              disabled
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              캐러셀
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              스크롤
            </button>
          </div>
        </div>

        {/* 스켈레톤 컨테이너 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-900/20 via-gray-800/30 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
          <div className={`flex py-4 ${isCarouselMode ? "" : "gap-4"} px-4`}>
            {Array.from({ length: visibleCards }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex-shrink-0"
                style={
                  isCarouselMode
                    ? {
                        width: `${100 / visibleCards}%`,
                        paddingRight: index < visibleCards - 1 ? "1rem" : "0",
                      }
                    : {
                        width: `${100 / visibleCards}%`,
                        minWidth: "200px",
                        maxWidth: "300px",
                      }
                }
              >
                <div className="enhanced-favorite-card p-4 rounded-xl border border-gray-600/30 shadow-lg">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-gray-700/50 to-gray-600/40 rounded-lg mb-3 aspect-square relative overflow-hidden border border-gray-600/30">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                        style={{
                          animation: "shimmer 2s ease-in-out infinite",
                          transform: "translateX(-100%)",
                          animationDelay: `${index * 0.1}s`,
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-600/20 to-gray-700/30"
                        style={{
                          animation: "skeletonPulse 2s ease-in-out infinite",
                        }}
                      ></div>
                    </div>
                    <div className="space-y-3">
                      <div
                        className="h-5 bg-gradient-to-r from-gray-700/60 to-gray-600/50 rounded-md w-4/5 border border-gray-600/20"
                        style={{
                          animation: "skeletonPulse 2s ease-in-out infinite",
                          animationDelay: `${index * 0.1 + 0.2}s`,
                        }}
                      ></div>
                      <div
                        className="h-4 bg-gradient-to-r from-gray-600/50 to-gray-500/40 rounded-md w-3/5 border border-gray-600/20"
                        style={{
                          animation: "skeletonPulse 2s ease-in-out infinite",
                          animationDelay: `${index * 0.1 + 0.4}s`,
                        }}
                      ></div>
                      <div
                        className="h-3 bg-gradient-to-r from-gray-500/40 to-gray-400/30 rounded-md w-2/5 border border-gray-600/20"
                        style={{
                          animation: "skeletonPulse 2s ease-in-out infinite",
                          animationDelay: `${index * 0.1 + 0.6}s`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (albums.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 모드 토글 버튼 */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
          <button
            onClick={() => setIsCarouselMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              isCarouselMode
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            캐러셀
          </button>
          <button
            onClick={() => setIsCarouselMode(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              !isCarouselMode
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            스크롤
          </button>
        </div>
      </div>

      {/* 캐러셀/스크롤 컨테이너 */}
      <div
        className={`relative ${
          isCarouselMode ? "overflow-hidden" : "overflow-x-auto"
        } bg-gradient-to-r from-gray-900/20 via-gray-800/30 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl`}
        onMouseDown={isCarouselMode ? handleMouseDown : undefined}
        onMouseMove={isCarouselMode ? handleMouseMove : undefined}
        onMouseUp={isCarouselMode ? handleMouseUp : undefined}
        onMouseLeave={isCarouselMode ? handleMouseLeave : undefined}
        onTouchStart={isCarouselMode ? handleTouchStart : undefined}
        onTouchMove={isCarouselMode ? handleTouchMove : undefined}
        onTouchEnd={isCarouselMode ? handleTouchEnd : undefined}
      >
        <div
          className={`flex py-4 ${
            isCarouselMode
              ? "transition-transform duration-300 ease-in-out"
              : "gap-4"
          }`}
          style={
            isCarouselMode
              ? {
                  transform: `translateX(calc(-${
                    currentSlide * 100
                  }% + ${dragOffset}px))`,
                }
              : {}
          }
        >
          {albums.map((album, index) => (
            <div
              key={`carousel-${album.id}-${index}`}
              className="flex-shrink-0"
              style={
                isCarouselMode
                  ? {
                      width: `${100 / visibleCards}%`,
                      paddingRight: index < albums.length - 1 ? "1rem" : "0",
                    }
                  : {
                      width: `${100 / visibleCards}%`,
                      minWidth: "200px",
                      maxWidth: "300px",
                    }
              }
            >
              {renderAlbumCard(album)}
            </div>
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 - 캐러셀 모드일 때만 표시 */}
      {isCarouselMode && totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/90 text-cyan-400 hover:text-cyan-300 rounded-full p-3 transition-all duration-300 z-10 shadow-lg border border-cyan-400/20 hover:border-cyan-400/40 hover:shadow-cyan-400/20"
            disabled={currentSlide === 0}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/90 text-cyan-400 hover:text-cyan-300 rounded-full p-3 transition-all duration-300 z-10 shadow-lg border border-cyan-400/20 hover:border-cyan-400/40 hover:shadow-cyan-400/20"
            disabled={currentSlide === totalSlides - 1}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* 슬라이드 인디케이터 - 캐러셀 모드일 때만 표시 */}
      {isCarouselMode && totalSlides > 1 && (
        <div className="flex justify-center mt-6 space-x-3">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/50 border border-cyan-400/30"
                  : "bg-gray-600/60 hover:bg-gray-500/80 border border-gray-500/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
