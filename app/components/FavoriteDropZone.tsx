import React from "react";
import Image from "next/image";

export type DropItem = {
  id: string; // Prisma 자동 생성 ID
  spotifyId: string; // Spotify의 실제 ID
  name: string;
  image: string;
  type: "album" | "artist";
};

type FavoriteDropZoneProps = {
  favorites: DropItem[];
  setFavorites: React.Dispatch<React.SetStateAction<DropItem[]>>;
  onDropItem: (item: DropItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  onArtistClick?: (artistId: string) => void;
  onRemoveFavorite: (id: string, type: "artist" | "album") => Promise<void>;
  onRefresh?: () => Promise<void>;
};

export const FavoriteDropZone: React.FC<FavoriteDropZoneProps> = ({
  favorites,
  setFavorites,
  onDropItem,
  isOpen,
  onToggle,
  onArtistClick,
  onRemoveFavorite,
  onRefresh,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovering(false);

    try {
      const data = event.dataTransfer.getData("application/json");
      console.log("Drop data raw:", data);

      if (data) {
        const item: DropItem = JSON.parse(data);
        console.log("Drop parsed item:", item);

        // 중복 검사 (spotifyId로 비교)
        if (favorites.find((fav) => fav.spotifyId === item.spotifyId)) {
          console.log("Item already in favorites:", item);
          return;
        }

        // 중복 아니면 상태 변경 및 콜백 호출
        setFavorites((prev) => [...prev, item]);
        console.log("About to call onDropItem with:", item);
        onDropItem(item);
      }
    } catch (error) {
      console.error("Invalid drop data:", error);
    }
  };

  const removeFavorite = async (id: string, type: "artist" | "album") => {
    console.log("🎯 FavoriteDropZone에서 removeFavorite 호출:", { id, type });
    try {
      await onRemoveFavorite(id, type);
      console.log("✅ FavoriteDropZone removeFavorite 완료");
    } catch (error) {
      console.error("❌ FavoriteDropZone removeFavorite 오류:", error);
    }
  };

  console.log("Received favorites prop:", favorites);

  // Move toggle button state and refs to top level
  const [buttonPos, setButtonPos] = React.useState<{
    top: number;
    left: number;
  }>({ top: 16, left: 16 });
  const draggingRef = React.useRef(false);
  const movedRef = React.useRef(false);
  const posRef = React.useRef(buttonPos);
  const pointerOffsetRef = React.useRef({ x: 0, y: 0 });
  const buttonSizeRef = React.useRef({ w: 56, h: 56 });

  React.useEffect(() => {
    posRef.current = buttonPos;
  }, [buttonPos]);

  React.useEffect(() => {
    // 초기 위치 로드
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("favoriteTogglePos")
          : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed?.top === "number" &&
          typeof parsed?.left === "number"
        ) {
          setButtonPos({ top: parsed.top, left: parsed.left });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      movedRef.current = true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const left = Math.max(
        8,
        Math.min(
          vw - buttonSizeRef.current.w - 8,
          e.clientX - pointerOffsetRef.current.x
        )
      );
      const top = Math.max(
        8,
        Math.min(
          vh - buttonSizeRef.current.h - 8,
          e.clientY - pointerOffsetRef.current.y
        )
      );
      setButtonPos({ top, left });
    };
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        try {
          localStorage.setItem(
            "favoriteTogglePos",
            JSON.stringify(posRef.current)
          );
        } catch {}
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (
    e
  ) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    buttonSizeRef.current = { w: rect.width, h: rect.height };
    pointerOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    draggingRef.current = true;
    movedRef.current = false;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    // 드래그 후 클릭 발생 방지
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
      return;
    }
    onToggle();
  };

  return (
    <>
      {/* 사이드바 토글 버튼 */}
      <button
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        style={{ top: buttonPos.top, left: buttonPos.left }}
        className="fixed z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-move"
        aria-label="즐겨찾기 사이드바 토글"
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
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* 사이드바 */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "320px" }}
      >
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              즐겨찾기
            </h2>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                aria-label="즐겨찾기 새로고침"
                title="즐겨찾기 목록 새로고침"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

        {/* 드롭 영역 */}
        <div
          className={`m-4 p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
            isHovering
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="favorite-drop-zone"
        >
          {favorites.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm">앨범이나 아티스트를 여기에 드래그하여</p>
              <p className="text-sm">즐겨찾기에 추가하세요</p>
              <p className="text-xs text-gray-400 mt-2">
                💡 이미 즐겨찾기된 항목도 재배치 가능
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 아티스트 즐겨찾기 섹션 */}
              {favorites.filter((item) => item.type === "artist").length >
                0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    🎤 아티스트 (
                    {favorites.filter((item) => item.type === "artist").length})
                  </h3>
                  <div className="space-y-2">
                    {favorites
                      .filter((item) => item.type === "artist")
                      .map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: item.id,
                                name: item.name,
                                image: item.image || "",
                                type: item.type,
                              })
                            );
                          }}
                          className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm cursor-move hover:shadow-md transition-shadow"
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => onArtistClick?.(item.id)}
                              className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate text-left w-full hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            >
                              {item.name}
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              아티스트
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              console.log(
                                "🎯 아티스트 즐겨찾기 해제 버튼 클릭:",
                                {
                                  id: item.id,
                                  spotifyId: item.spotifyId,
                                  name: item.name,
                                  type: item.type,
                                }
                              );
                              removeFavorite(item.spotifyId, item.type);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            aria-label={`${item.name} 즐겨찾기에서 제거`}
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
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 앨범 즐겨찾기 섹션 */}
              {favorites.filter((item) => item.type === "album").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    💿 앨범 (
                    {favorites.filter((item) => item.type === "album").length})
                  </h3>
                  <div className="space-y-2">
                    {favorites
                      .filter((item) => item.type === "album")
                      .map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: item.id,
                                name: item.name,
                                image: item.image || "",
                                type: item.type,
                              })
                            );
                          }}
                          className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm cursor-move hover:shadow-md transition-shadow"
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {item.name}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              앨범
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              console.log("🎯 앨범 즐겨찾기 해제 버튼 클릭:", {
                                id: item.id,
                                spotifyId: item.spotifyId,
                                name: item.name,
                                type: item.type,
                              });
                              removeFavorite(item.spotifyId, item.type);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            aria-label={`${item.name} 즐겨찾기에서 제거`}
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
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
