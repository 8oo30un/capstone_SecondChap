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

  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json({ error }, { status: res.status });
  }

  const albumData = await res.json();
  return NextResponse.json(albumData);
}
