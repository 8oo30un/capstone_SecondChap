import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

// Spotify API 응답 타입 정의
interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  album_type: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
}

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
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Spotify artist ID 형식 검증 (22자리 영숫자)
    const spotifyArtistIdRegex = /^[a-zA-Z0-9]{22}$/;
    if (!spotifyArtistIdRegex.test(artistId)) {
      console.error("Invalid Spotify artist ID format:", artistId);
      return NextResponse.json(
        { error: "Invalid Spotify artist ID format" },
        { status: 400 }
      );
    }

    const token = await getSpotifyAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: "Failed to get Spotify token" },
        { status: 500 }
      );
    }

    // 아티스트의 앨범 목록 가져오기 (최신순으로 정렬)
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!albumsResponse.ok) {
      const errorText = await albumsResponse.text();
      console.error(`Spotify API error for artist ${artistId}:`, {
        status: albumsResponse.status,
        statusText: albumsResponse.statusText,
        error: errorText,
        artistId: artistId,
        headers: Object.fromEntries(albumsResponse.headers.entries()),
      });

      // 429 에러 (Rate Limit) 특별 처리
      if (albumsResponse.status === 429) {
        // 개발 환경에서는 더 짧은 대기 시간
        const isDevelopment = process.env.NODE_ENV === "development";
        const waitTime = isDevelopment ? 30000 : 120000; // 개발: 30초, 프로덕션: 2분

        console.log(
          `⚠️ Rate Limit 도달, ${waitTime / 1000}초 대기 후 재시도...`
        );

        // Rate Limit 발생 시 대기 후 재시도
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        console.log("🔄 Rate Limit 대기 완료, 재시도 중...");

        // 재시도
        const retryResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (retryResponse.ok) {
          console.log("✅ Rate Limit 재시도 성공!");
          const retryData = await retryResponse.json();

          // 앨범 데이터 정리 및 정렬
          const albums: SpotifyAlbum[] = retryData.items
            .map((album: SpotifyAlbum) => ({
              id: album.id,
              name: album.name,
              release_date: album.release_date,
              total_tracks: album.total_tracks,
              album_type: album.album_type,
              images: album.images,
              external_urls: album.external_urls,
              artists: album.artists,
            }))
            .sort((a: SpotifyAlbum, b: SpotifyAlbum) => {
              return (
                new Date(b.release_date).getTime() -
                new Date(a.release_date).getTime()
              );
            });

          // 아티스트 정보 가져오기
          const artistResponse = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let artistInfo: SpotifyArtist | null = null;
          if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            artistInfo = {
              id: artistData.id,
              name: artistData.name,
              images: artistData.images,
              genres: artistData.genres,
              popularity: artistData.popularity,
              external_urls: artistData.external_urls,
            };
          }

          return NextResponse.json({
            artist: artistInfo,
            albums: albums,
            total: albums.length,
          });
        } else {
          console.log("❌ Rate Limit 재시도 실패, 빈 결과 반환");
          return NextResponse.json({
            artist: null,
            albums: [],
            total: 0,
            rateLimitReached: true,
            message:
              "Spotify API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.",
          });
        }
      }

      throw new Error(
        `Spotify API error: ${albumsResponse.status} - ${errorText}`
      );
    }

    const albumsData = await albumsResponse.json();

    // 앨범 데이터 정리 및 정렬
    const albums: SpotifyAlbum[] = albumsData.items
      .map((album: SpotifyAlbum) => ({
        id: album.id,
        name: album.name,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        album_type: album.album_type, // album, single, compilation
        images: album.images,
        external_urls: album.external_urls,
        artists: album.artists,
      }))
      .sort((a: SpotifyAlbum, b: SpotifyAlbum) => {
        // 날짜순으로 정렬 (최신순)
        return (
          new Date(b.release_date).getTime() -
          new Date(a.release_date).getTime()
        );
      });

    // 아티스트 정보도 함께 가져오기
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let artistInfo: SpotifyArtist | null = null;
    if (artistResponse.ok) {
      const artistData = await artistResponse.json();
      artistInfo = {
        id: artistData.id,
        name: artistData.name,
        images: artistData.images,
        genres: artistData.genres,
        popularity: artistData.popularity,
        external_urls: artistData.external_urls,
      };
    }

    return NextResponse.json({
      artist: artistInfo,
      albums: albums,
      total: albums.length,
    });
  } catch (error) {
    console.error("Error fetching artist albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist albums" },
      { status: 500 }
    );
  }
}
