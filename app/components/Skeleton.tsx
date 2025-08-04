// app/components/Skeleton.tsx
type Props = {
  variant: "album" | "artist";
  count?: number;
};

export default function Skeleton({ variant, count = 16 }: Props) {
  const skeletonItems = Array.from({ length: count });

  if (variant === "artist") {
    return (
      <div className="mb-4 grid grid-cols-8 gap-3 max-h-96 overflow-y-auto border-b border-gray-300 dark:border-gray-700 p-2">
        {skeletonItems.map((_, i) => (
          <div
            key={i}
            className="w-full h-24 m-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
      {skeletonItems.map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm animate-pulse flex flex-col"
        >
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
