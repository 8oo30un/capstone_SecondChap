// app/api/spotify/search-or-new-releases/route.ts
import { NextResponse } from "next/server";
import { getSpotifyAccessToken, getArtistGenres } from "@/lib/spotify";

interface SpotifyAlbum {
  id: string;
  artists: { id: string }[];
  [key: string]: unknown;
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
        )}&type=album&limit=40`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok)
        return NextResponse.json({ error: data }, { status: res.status });
      albums = data.albums?.items || [];
    } else {
      const res = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok)
        return NextResponse.json({ error: data }, { status: res.status });
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

    return NextResponse.json({ albums });
  } catch (err) {
    console.error("Spotify search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
