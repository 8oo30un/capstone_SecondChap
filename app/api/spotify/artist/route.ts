import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

// Spotify API 응답 타입 정의
interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // 환경 변수 확인
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    console.log("🔍 Artist API - 환경 변수 확인:", {
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
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      console.error("❌ Artist ID 누락");
      return NextResponse.json(
        {
          error: "Artist ID is required",
          details: "artistId 쿼리 파라미터가 필요합니다.",
          received: null,
        },
        { status: 400 }
      );
    }

    // Spotify artist ID 형식 검증 (22자리 영숫자)
    const spotifyArtistIdRegex = /^[a-zA-Z0-9]{22}$/;
    if (!spotifyArtistIdRegex.test(artistId)) {
      console.error("❌ Invalid Spotify artist ID format:", artistId);
      return NextResponse.json(
        {
          error: "Invalid Spotify artist ID format",
          details: "Spotify artist ID는 22자리 영숫자여야 합니다.",
          received: artistId,
          expectedFormat: "22자리 영숫자 (예: 6eUKZXaKkcviH0Ku9w2n3V)",
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

    // 아티스트 정보 가져오기
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!artistResponse.ok) {
      const errorText = await artistResponse.text();
      console.error(`❌ Spotify API error: ${artistResponse.status}`, {
        status: artistResponse.status,
        statusText: artistResponse.statusText,
        error: errorText,
        artistId: artistId,
        url: `https://api.spotify.com/v1/artists/${artistId}`,
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
          status: artistResponse.status,
          artistId: artistId,
          solution: "Spotify API 상태를 확인하거나 잠시 후 다시 시도해주세요.",
        },
        { status: artistResponse.status }
      );
    }

    const artistData = await artistResponse.json();

    // 아티스트 데이터 정리
    const artist: SpotifyArtist = {
      id: artistData.id,
      name: artistData.name,
      images: artistData.images,
      genres: artistData.genres,
      popularity: artistData.popularity,
      external_urls: artistData.external_urls,
    };

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Error fetching artist:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist" },
      { status: 500 }
    );
  }
}
