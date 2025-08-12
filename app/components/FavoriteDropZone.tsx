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
};

export const FavoriteDropZone: React.FC<FavoriteDropZoneProps> = ({
  favorites,
  setFavorites,
  onDropItem,
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

  console.log("Received favorites prop:", favorites);

  return (
    <div
      style={{
        borderWidth: "2px",
        borderStyle: "dashed",
        borderColor: isHovering ? "#1890ff" : "#888",
        borderRadius: "8px",
        padding: "32px",
        textAlign: "center",
        color: isHovering ? "#1890ff" : "#666",
        background: isHovering ? "#e6f7ff" : "#fafbfc",
        transition: "background 0.2s, border-color 0.2s",
        cursor: "pointer",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="favorite-drop-zone"
    >
      {favorites.length === 0 ? (
        <span>Drag and drop an album or artist here to add to favorites</span>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          {favorites.map((drop) => (
            <div key={drop.id} style={{ textAlign: "center" }}>
              <img
                src={drop.image}
                alt={drop.name}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>
                {drop.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
