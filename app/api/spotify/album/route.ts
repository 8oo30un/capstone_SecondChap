// app/api/spotify/album/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const albumId = req.nextUrl.searchParams.get("id");
  if (!albumId) {
    return NextResponse.json({ error: "Missing album ID" }, { status: 400 });
  }

  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Failed to retrieve access token" },
      { status: 500 }
    );
  }

  // 간단한 재시도 + 429/5xx 방어 및 text 파싱 fallback
  const url = `https://api.spotify.com/v1/albums/${albumId}`;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }

      // 429 처리: Retry-After 헤더 존중
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After")) || 1;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // 비정상 응답 내용을 안전하게 파싱
      const text = await res.text();
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(text);
      } catch {
        errorBody = { message: text };
      }
      return NextResponse.json({ error: errorBody }, { status: res.status });
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return NextResponse.json(
    {
      error: "Failed to fetch album details",
      details: String(lastError ?? ""),
    },
    { status: 502 }
  );
}
