import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

// Spotify API 응답 타입 정의
interface SpotifyTrackResponse {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
}

interface SpotifyTracksData {
  items: SpotifyTrackResponse[];
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

// 내부 사용 타입 정의
interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // 환경 변수 확인
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    console.log("🔍 Album-Tracks API - 환경 변수 확인:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!clientId || !clientSecret) {
      console.error("❌ Spotify 환경 변수 누락");
      return NextResponse.json(
        {
          error: "Spotify credentials not configured",
          details:
            "SPOTIFY_CLIENT_ID와 SPOTIFY_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.",
          solution:
            "Vercel 대시보드에서 환경 변수를 설정하거나 로컬에서 .env.local 파일을 생성하세요.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");

    if (!albumId) {
      console.error("❌ Album ID 누락");
      return NextResponse.json(
        {
          error: "Album ID is required",
          details: "albumId 쿼리 파라미터가 필요합니다.",
          received: null,
        },
        { status: 400 }
      );
    }

    // Spotify album ID 형식 검증 (22자리 영숫자)
    const spotifyAlbumIdRegex = /^[a-zA-Z0-9]{22}$/;
    if (!spotifyAlbumIdRegex.test(albumId)) {
      console.error("❌ Invalid Spotify album ID format:", albumId);
      return NextResponse.json(
        {
          error: "Invalid Spotify album ID format",
          details: "Spotify album ID는 22자리 영숫자여야 합니다.",
          received: albumId,
          expectedFormat: "22자리 영숫자 (예: 4aawyAB9vmqN3uQ7FjRGTy)",
        },
        { status: 400 }
      );
    }

    const token = await getSpotifyAccessToken();
    if (!token) {
      console.error("❌ Spotify 토큰 획득 실패");
      return NextResponse.json(
        {
          error: "Failed to get Spotify token",
          details: "Spotify API 인증에 실패했습니다. 환경 변수를 확인해주세요.",
        },
        { status: 500 }
      );
    }

    console.log(`🔍 앨범 트랙 로드 시도: ${albumId}`);

    // 앨범의 트랙 목록 가져오기
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      const errorText = await tracksResponse.text();
      console.error(`❌ Spotify API error: ${tracksResponse.status}`, {
        status: tracksResponse.status,
        statusText: tracksResponse.statusText,
        error: errorText,
        albumId: albumId,
        url: `https://api.spotify.com/v1/albums/${albumId}/tracks`,
      });

      // Spotify API 에러 응답 구조화
      let errorDetails = "알 수 없는 오류";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorDetails = errorData.error.message;
        }
      } catch {
        errorDetails = errorText;
      }

      return NextResponse.json(
        {
          error: "Spotify API request failed",
          details: errorDetails,
          status: tracksResponse.status,
          albumId: albumId,
          solution: "Spotify API 상태를 확인하거나 잠시 후 다시 시도해주세요.",
        },
        { status: tracksResponse.status }
      );
    }

    const tracksData: SpotifyTracksData = await tracksResponse.json();
    console.log(
      `✅ 앨범 트랙 로드 성공: ${tracksData.items?.length || 0}개 트랙`
    );

    // 트랙 데이터 정리
    const tracks: SpotifyTrack[] = tracksData.items.map(
      (track: SpotifyTrackResponse) => ({
        id: track.id,
        name: track.name,
        track_number: track.track_number,
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        external_urls: track.external_urls,
        artists: track.artists.map(
          (artist: SpotifyTrackResponse["artists"][0]) => ({
            id: artist.id,
            name: artist.name,
          })
        ),
      })
    );

    return NextResponse.json({
      albumId: albumId,
      tracks: tracks,
      total: tracks.length,
      limit: tracksData.limit,
      offset: tracksData.offset,
      next: tracksData.next,
      previous: tracksData.previous,
    });
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch album tracks",
        details:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
