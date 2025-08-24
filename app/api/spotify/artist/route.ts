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
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("id");

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
      console.error(`Spotify API error: ${artistResponse.status}`, {
        status: artistResponse.status,
        statusText: artistResponse.statusText,
        error: errorText,
        artistId: artistId,
      });
      throw new Error(
        `Spotify API error: ${artistResponse.status} - ${errorText}`
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
