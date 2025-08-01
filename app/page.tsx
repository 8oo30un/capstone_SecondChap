"use client";

import { useEffect, useState } from "react";

type TrackInfo = {
  name: string;
  artist: {
    name: string;
  };
  album?: {
    title?: string;
    image?: { "#text": string; size: string }[];
  };
  playcount?: string;
  listeners?: string;
};

export default function HomePage() {
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  useEffect(() => {
    const fetchTrack = async () => {
      const res = await fetch("/api/lastfm?artist=IU&track=Love+Wins");
      const data = await res.json();
      setTrackInfo(data);
    };
    fetchTrack();
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">🎧 Last.fm 트랙 정보</h1>
      {trackInfo ? (
        <pre className="mt-4 bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(trackInfo, null, 2)}
        </pre>
      ) : (
        <p className="text-gray-600">로딩 중...</p>
      )}
    </main>
  );
}
