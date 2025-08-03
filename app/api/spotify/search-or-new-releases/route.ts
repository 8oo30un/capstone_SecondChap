import { NextResponse } from "next/server";

interface SpotifyAlbum {
  id: string;
  artists: {
    id: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query"); // 검색어
  const country = searchParams.get("country") || "KR";
  const genreFilter = searchParams.get("genre");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Spotify credentials" },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // 토큰 발급
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token received" },
        { status: 500 }
      );
    }

    let albums: SpotifyAlbum[] = [];

    if (query) {
      // 검색 API 호출 (트랙 검색)
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=40`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const searchData = await searchRes.json();
      if (!searchRes.ok) {
        return NextResponse.json(
          { error: searchData },
          { status: searchRes.status }
        );
      }
      albums = searchData.albums?.items || [];
    } else {
      // 최근 발매곡 API 호출
      const newReleaseRes = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const newReleaseData = await newReleaseRes.json();
      if (!newReleaseRes.ok) {
        return NextResponse.json(
          { error: newReleaseData },
          { status: newReleaseRes.status }
        );
      }
      albums = newReleaseData.albums?.items || [];
    }

    // 장르 필터링(옵션)
    if (genreFilter) {
      const filteredAlbums = await Promise.all(
        albums.map(async (album: SpotifyAlbum) => {
          const artistId = album.artists?.[0]?.id;
          const artistRes = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const artistData = await artistRes.json();
          const artistGenres: string[] = artistData.genres || [];

          const lowerGenreFilter = genreFilter.toLowerCase();
          const matched = artistGenres.some((g) => {
            const lowerG = g.toLowerCase();
            return (
              lowerG.includes(lowerGenreFilter) ||
              (lowerGenreFilter === "k-pop" && lowerG.includes("korean"))
            );
          });

          if (matched) {
            return album;
          }
          return null;
        })
      );
      albums = filteredAlbums.filter(
        (album): album is SpotifyAlbum => album !== null
      );
    }

    return NextResponse.json({ albums });
  } catch (err) {
    console.error("Spotify error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
