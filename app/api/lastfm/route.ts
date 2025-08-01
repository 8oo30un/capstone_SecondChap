import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.LASTFM_API_KEY;
  const { searchParams } = new URL(req.url);

  const artist = searchParams.get("artist");
  const track = searchParams.get("track");

  if (!artist || !track) {
    return NextResponse.json(
      { error: "Missing artist or track" },
      { status: 400 }
    );
  }

  const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(
    artist
  )}&track=${encodeURIComponent(track)}&format=json`;

  try {
    console.log("Last.fm API URL:", apiUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Last.fm API error response:", errorText);
      throw new Error("Last.fm request failed");
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Last.fm:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Last.fm" },
      { status: 500 }
    );
  }
}
