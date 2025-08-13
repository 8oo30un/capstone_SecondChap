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
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
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
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50&market=KR`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!albumsResponse.ok) {
      throw new Error(`Spotify API error: ${albumsResponse.status}`);
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
