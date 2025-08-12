import React from "react";

export type DropItem = {
  id: string;
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
};

export const FavoriteDropZone: React.FC<FavoriteDropZoneProps> = ({
  favorites,
  setFavorites,
  onDropItem,
  isOpen,
  onToggle,
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

        // 중복 검사
        if (favorites.find((fav) => fav.id === item.id)) {
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

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  console.log("Received favorites prop:", favorites);

  return (
    <>
      {/* 사이드바 토글 버튼 */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            즐겨찾기
          </h2>
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
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                즐겨찾기 ({favorites.length})
              </p>
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {item.type}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(item.id)}
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
          )}
        </div>
      </div>
    </>
  );
};
