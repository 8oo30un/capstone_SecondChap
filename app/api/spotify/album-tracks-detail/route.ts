import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const albumId = req.nextUrl.searchParams.get("albumId");

  if (!albumId) {
    return NextResponse.json(
      { error: "앨범 ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // Spotify API 토큰 가져오기
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Spotify 토큰 획득 실패");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 앨범 트랙 정보 가져오기
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      throw new Error("앨범 트랙 정보를 가져올 수 없습니다.");
    }

    const tracksData = await tracksResponse.json();

    // 트랙 정보를 필요한 형태로 변환
    const tracks = tracksData.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      duration: Math.floor(track.duration_ms / 1000), // 밀리초를 초로 변환
      track_number: track.track_number,
      artists: track.artists.map((artist: any) => ({
        name: artist.name,
        id: artist.id,
      })),
      preview_url: track.preview_url,
      external_urls: track.external_urls,
    }));

    return NextResponse.json({
      success: true,
      tracks,
      total: tracksData.total,
    });
  } catch (error) {
    console.error("앨범 트랙 정보 로드 오류:", error);
    return NextResponse.json(
      {
        error: "앨범 트랙 정보를 불러올 수 없습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
