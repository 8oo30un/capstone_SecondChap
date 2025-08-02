// app/api/spotify/new-releases/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // Step 1: Access Token 요청
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

    // Step 2: New Releases 요청
    const apiRes = await fetch(
      "https://api.spotify.com/v1/browse/new-releases?limit=20",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json({ error: data }, { status: apiRes.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Spotify error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify new releases" },
      { status: 500 }
    );
  }
}
