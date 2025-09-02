"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

export type DropItem = {
  id: string; // Prisma 자동 생성 ID
  spotifyId: string; // Spotify의 실제 ID (필수)
  name: string;
  image: string;
  type: "album" | "artist";
};

interface FavoriteDropZoneProps {
  favorites: DropItem[];
  setFavorites: (favorites: DropItem[]) => void;
  onDropItem: (item: DropItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  onArtistClick: (artistId: string) => void;
  onRemoveFavorite: (id: string) => void;
  onRefresh: () => void;
}

export default function FavoriteDropZone({
  favorites,
  onDropItem,
  isOpen,
  onToggle,
  onArtistClick,
  onRemoveFavorite,
  onRefresh,
}: FavoriteDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const itemData = e.dataTransfer.getData("application/json");
      if (itemData) {
        try {
          const item = JSON.parse(itemData);
          onDropItem(item);
        } catch (error) {
          console.error("드롭된 데이터 파싱 오류:", error);
        }
      }
    },
    [onDropItem]
  );

  const toggleSidebar = () => {
    onToggle();
  };

  const refreshFavorites = () => {
    onRefresh();
  };

  // 버튼 드래그 시작
  const handleButtonDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // 버튼 드래그 중
  // 경고(react-hooks/exhaustive-deps 등) 문제 해결을 위해 useCallback 사용

  const handleButtonDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 내에서만 이동
      const maxX = window.innerWidth - 64; // 버튼 크기 고려
      const maxY = window.innerHeight - 64;

      setButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset]
  );

  // 버튼 드래그 종료
  const handleButtonDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 마우스 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      // 드래그 중일 때 텍스트 선택 방지
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      document.addEventListener("mousemove", handleButtonDrag);
      document.addEventListener("mouseup", handleButtonDragEnd);

      return () => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";

        document.removeEventListener("mousemove", handleButtonDrag);
        document.removeEventListener("mouseup", handleButtonDragEnd);
      };
    }
  }, [isDragging, dragOffset, handleButtonDrag, handleButtonDragEnd]);

  // 클릭 이벤트 처리 (드래그 중이 아닐 때만)
  const handleButtonClick = () => {
    if (!isDragging) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* 사이드바 토글 버튼 */}
      <div
        className="fixed z-50 group cursor-move"
        style={{
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
        }}
      >
        <button
          onClick={handleButtonClick}
          onMouseDown={handleButtonDragStart}
          className={`p-3 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-300 select-none ${
            isDragging
              ? "scale-95 shadow-lg shadow-blue-500/70 cursor-grabbing"
              : "hover:scale-110 hover:shadow-blue-500/50 cursor-move"
          }`}
          aria-label="즐겨찾기 사이드바 토글"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {/* 애니메이션 핑 효과 */}
            <div className="absolute -inset-1 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </button>

        {/* 호버 시 안내 토스트 메시지 */}
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900/95 text-white px-4 py-2 rounded-lg shadow-xl border border-gray-500/30 backdrop-blur-sm whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-sm font-medium">즐겨찾기 관리</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              드래그 앤 드롭으로 즐겨찾기 추가
            </div>
          </div>
        </div>
      </div>

      {/* 사이드바 */}
      <div
        className={`fixed left-0 top-0 h-full w-96 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-r border-gray-500/30 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-6 border-b border-blue-500/30 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">즐겨찾기</h2>
                <p className="text-sm text-blue-300">Favorite Items</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshFavorites}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-500/20 rounded-lg transition-all duration-200"
                aria-label="즐겨찾기 새로고침"
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200"
                aria-label="사이드바 닫기"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-300">
              총 {favorites.length}개의 즐겨찾기 항목
            </p>
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {/* 드롭 존 */}
          <div className="p-6">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center backdrop-blur-sm transition-all duration-300 ${
                isDragOver
                  ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/30 scale-105"
                  : "border-gray-600/50 bg-gray-800/30 hover:border-blue-400/50 hover:bg-blue-500/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* 음표 배경 패턴 */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-4 left-4 text-4xl text-blue-400">
                  ♪
                </div>
                <div className="absolute top-8 right-6 text-2xl text-purple-400">
                  ♫
                </div>
                <div className="absolute bottom-6 left-8 text-3xl text-pink-400">
                  ♬
                </div>
              </div>

              <div className="relative z-10">
                <div
                  className={`w-16 h-16 mx-auto mb-4 text-blue-400 relative group ${
                    isDragOver ? "animate-pulse" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-lg transition-opacity duration-300 ${
                      isDragOver
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  ></div>
                  <div
                    className={`relative transform transition-all duration-500 ${
                      isDragOver
                        ? "scale-125 rotate-12 -translate-y-3"
                        : "group-hover:scale-110 group-hover:rotate-6 group-hover:-translate-y-2"
                    }`}
                  >
                    <svg
                      className={`w-full h-full transition-all duration-500 ${
                        isDragOver
                          ? "drop-shadow-[0_0_30px_rgba(59,130,246,1)]"
                          : "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{
                        filter: isDragOver
                          ? "drop-shadow(0 0 20px rgba(59, 130, 246, 1))"
                          : "drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))",
                        transform: isDragOver
                          ? "perspective(1000px) rotateX(10deg) rotateY(10deg)"
                          : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
                        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </div>
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 transition-all duration-300 ${
                    isDragOver
                      ? "text-blue-400 scale-105 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      : "text-white"
                  }`}
                >
                  여기에 드래그하여 즐겨찾기 추가
                </h3>
                <p
                  className={`text-sm transition-all duration-300 ${
                    isDragOver ? "text-blue-300 scale-105" : "text-gray-400"
                  }`}
                >
                  아티스트나 앨범을 이곳에 드래그하면 즐겨찾기에 추가됩니다
                </p>
              </div>
            </div>
          </div>

          {/* 즐겨찾기 목록 */}
          <div className="px-6 pb-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  아직 즐겨찾기가 없습니다
                </h3>
                <p className="text-sm text-gray-500">
                  검색 결과에서 좋아하는 항목을 드래그하여 추가해보세요
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-gray-700/60 hover:to-gray-600/60 transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      if (item.type === "artist") {
                        onArtistClick(item.spotifyId);
                      }
                    }}
                  >
                    {/* 제거 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(item.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      aria-label="즐겨찾기에서 제거"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                          {item.type === "artist" ? "A" : "L"}
                        </div>
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="absolute inset-0 w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-blue-300 capitalize">
                          {item.type === "artist" ? "아티스트" : "앨범"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
