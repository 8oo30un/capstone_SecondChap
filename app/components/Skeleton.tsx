// app/components/Skeleton.tsx
type Props = {
  variant: "album" | "artist" | "albumDetail";
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

  if (variant === "albumDetail") {
    return (
      <div className="w-80 fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-lg p-4 overflow-y-auto animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32" />
          <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        <div className="flex flex-col md:flex-col gap-4">
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />

          <div className="flex flex-col gap-2 mb-4 mt-4">
            {[...Array(1)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
              </div>
            ))}
          </div>

          <p className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4" />

          <h4 className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2" />

          <ul className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <li
                key={i}
                className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"
              />
            ))}
          </ul>
        </div>
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
