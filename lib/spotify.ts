// lib/spotify.ts
export async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // 환경 변수 로딩 확인
  console.log("🔍 Spotify 환경 변수 확인:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
  });

  if (!clientId || !clientSecret) {
    console.error("❌ Spotify 환경 변수 누락:", { clientId, clientSecret });
    return null;
  }

  console.log("✅ 환경 변수 확인 완료, 토큰 요청 시작...");

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  console.log("🌐 Spotify 토큰 API 호출 시작...");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  console.log("📡 Spotify 토큰 API 응답:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Spotify 토큰 API 오류:", errorText);
    return null;
  }

  const data = await res.json();
  console.log("✅ Spotify 토큰 획득 성공:", {
    hasAccessToken: !!data.access_token,
    tokenLength: data.access_token?.length || 0,
  });

  return data.access_token ?? null;
}

export async function getArtistGenres(
  artistId: string,
  token: string
): Promise<string[]> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres || [];
}

export async function fetchArtistImage(
  artistId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.images?.[0]?.url || "";
}

// Spotify 플레이어에서 트랙 재생
export async function playTrack(
  trackUri: string,
  deviceId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      }
    );

    return res.ok;
  } catch (error) {
    console.error("❌ 트랙 재생 실패:", error);
    return false;
  }
}

// Spotify 플레이어에서 앨범 재생
export async function playAlbum(
  albumUri: string,
  deviceId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context_uri: albumUri,
        }),
      }
    );

    return res.ok;
  } catch (error) {
    console.error("❌ 앨범 재생 실패:", error);
    return false;
  }
}
