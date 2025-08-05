import { NextResponse } from "next/server";
import { getSpotifyAccessToken, getArtistGenres } from "@/lib/spotify";

interface SpotifyAlbum {
  id: string;
  artists: { id: string; name: string }[];
  [key: string]: unknown;
}

// 아티스트 프로필 이미지 가져오는 함수
async function getArtistImage(
  artistId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.images?.[0]?.url || "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "KR";
  const genreFilter = searchParams.get("genre")?.toLowerCase();

  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }

  try {
    let albums: SpotifyAlbum[] = [];

    if (query) {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=40&market=${country}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        console.log("Spotify API error response:", data);
        return NextResponse.json(
          { error: data, country },
          { status: res.status }
        );
      }
      albums = data.albums?.items || [];
    } else {
      const res = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        console.log("Spotify API error response:", data);
        return NextResponse.json(
          { error: data, country },
          { status: res.status }
        );
      }
      albums = data.albums?.items || [];
    }

    // 장르 필터링
    if (genreFilter) {
      const filtered = await Promise.all(
        albums.map(async (album) => {
          const artistId = album.artists?.[0]?.id;
          if (!artistId) return null;
          const genres = await getArtistGenres(artistId, accessToken);
          const matched = genres.some(
            (g) =>
              g.toLowerCase().includes(genreFilter) ||
              (genreFilter === "k-pop" && g.toLowerCase().includes("korean"))
          );
          return matched ? album : null;
        })
      );
      albums = filtered.filter((a): a is SpotifyAlbum => a !== null);
    }

    // 아티스트 프로필 이미지 한 번만 fetch (중복 제거)
    const artistMap = new Map<
      string,
      { id: string; name: string; image: string }
    >();
    for (const album of albums) {
      for (const artist of album.artists) {
        if (!artistMap.has(artist.id)) {
          const image = await getArtistImage(artist.id, accessToken);
          artistMap.set(artist.id, { id: artist.id, name: artist.name, image });
        }
      }
    }
    const artistsWithImages = Array.from(artistMap.values());

    return NextResponse.json({ albums, artists: artistsWithImages, country });
  } catch (err) {
    console.error("Spotify search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
