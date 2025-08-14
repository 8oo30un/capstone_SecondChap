import { NextResponse } from "next/server";
import { getSpotifyAccessToken, getArtistGenres } from "@/lib/spotify";

interface SpotifyAlbum {
  id: string;
  artists: { id: string; name: string }[];
  release_date?: string;
  [key: string]: unknown;
}

// 간단한 메모리 캐시 (프로세스 생명주기 동안)
const artistImageCache: Map<string, { url: string; ts: number }> = new Map();
const ARTIST_IMAGE_TTL_MS = 1000 * 60 * 60; // 1시간

function getCachedArtistImage(artistId: string): string | null {
  const entry = artistImageCache.get(artistId);
  if (entry && Date.now() - entry.ts < ARTIST_IMAGE_TTL_MS) {
    return entry.url;
  }
  return null;
}

function setCachedArtistImage(artistId: string, url: string) {
  artistImageCache.set(artistId, { url, ts: Date.now() });
}

// 여러 아티스트 이미지를 배치로 가져오는 함수 (최대 50개/요청)
async function getArtistImagesBulk(
  artistIds: string[],
  accessToken: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const idsToFetch: string[] = [];
  for (const id of artistIds) {
    const cached = getCachedArtistImage(id);
    if (cached !== null) {
      result.set(id, cached);
    } else {
      idsToFetch.push(id);
    }
  }

  const chunkSize = 50;
  for (let i = 0; i < idsToFetch.length; i += chunkSize) {
    const chunk = idsToFetch.slice(i, i + chunkSize);
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) {
        console.warn(
          "Failed to fetch artists batch:",
          res.status,
          res.statusText
        );
        continue;
      }
      const data = await res.json();
      for (const artist of data.artists || []) {
        const url: string = artist.images?.[0]?.url || "";
        result.set(artist.id, url);
        setCachedArtistImage(artist.id, url);
      }
    } catch (err) {
      console.warn("Error fetching artists batch:", err);
    }
  }

  return result;
}

// 국가별 우선 장르 및 검색어 설정
function getCountrySpecificSettings(country: string) {
  switch (country) {
    case "KR":
      return {
        priorityGenres: [
          "k-pop",
          "korean",
          "korean pop",
          "korean hip hop",
          "korean r&b",
          "korean rock",
        ],
        searchKeywords: [
          "korean",
          "k-pop",
          "korean pop",
          "korean artist",
          "korean singer",
        ],
        market: "KR",
        koreanBoost: true, // 한국 음악 부스트 플래그
        genreWeights: {
          "k-pop": 10,
          korean: 8,
          "korean pop": 9,
          "korean hip hop": 7,
          "korean r&b": 6,
          "korean rock": 5,
        },
      };
    case "JP":
      return {
        priorityGenres: [
          "j-pop",
          "japanese",
          "japanese pop",
          "japanese rock",
          "japanese hip hop",
        ],
        searchKeywords: [
          "japanese",
          "j-pop",
          "japanese pop",
          "japanese artist",
        ],
        market: "JP",
        koreanBoost: false,
        genreWeights: {
          "j-pop": 10,
          japanese: 8,
          "japanese pop": 9,
          "japanese rock": 7,
          "japanese hip hop": 6,
        },
      };
    case "US":
      return {
        priorityGenres: [
          "pop",
          "hip hop",
          "r&b",
          "rock",
          "country",
          "electronic",
        ],
        searchKeywords: ["american", "us pop", "hip hop", "american artist"],
        market: "US",
        koreanBoost: false,
        genreWeights: {
          pop: 10,
          "hip hop": 9,
          "r&b": 8,
          rock: 7,
          country: 6,
          electronic: 5,
        },
      };
    case "GB":
      return {
        priorityGenres: [
          "british",
          "uk pop",
          "british rock",
          "indie",
          "alternative",
          "electronic",
        ],
        searchKeywords: ["british", "uk", "english", "british artist"],
        market: "GB",
        koreanBoost: false,
        genreWeights: {
          british: 10,
          "uk pop": 9,
          "british rock": 8,
          indie: 7,
          alternative: 6,
          electronic: 5,
        },
      };
    default:
      return {
        priorityGenres: ["pop", "rock", "hip hop"],
        searchKeywords: [],
        market: country,
        koreanBoost: false,
        genreWeights: {
          pop: 5,
          rock: 4,
          "hip hop": 3,
        },
      };
  }
}

// 한국 아티스트/음악 판별 함수
async function isKoreanMusic(
  album: SpotifyAlbum,
  accessToken: string
): Promise<boolean> {
  try {
    // 1. 아티스트 이름으로 한국어/한국 관련 판별
    // 즐겨찾기한 아티스트만 가중치에 반영하도록, 특정 가수 이름 리스트는 제거
    const artistNames = album.artists.map((a) => a.name.toLowerCase());
    const koreanIndicators: string[] = ["korean", "korea", "k-pop", "kpop"];

    if (
      artistNames.some((name) =>
        koreanIndicators.some((indicator) => name.includes(indicator))
      )
    ) {
      return true;
    }

    // 2. 아티스트의 장르 정보로 판별
    for (const artist of album.artists) {
      const genres = await getArtistGenres(artist.id, accessToken);
      if (
        genres.some(
          (g) =>
            g.toLowerCase().includes("korean") ||
            g.toLowerCase().includes("k-pop")
        )
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn("Error checking if Korean music:", error);
    return false;
  }
}

// 앨범에 가중치 부여하는 함수
async function calculateAlbumWeight(
  album: SpotifyAlbum,
  countrySettings: ReturnType<typeof getCountrySpecificSettings>,
  accessToken: string,
  favoriteArtistIds: string[]
): Promise<number> {
  let weight = 0;

  try {
    // 1. 발매일 가중치 (최신일수록 높음) - 더 강하게 적용
    const releaseDate = new Date(album.release_date || "1970-01-01");
    const daysSinceRelease =
      (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceRelease <= 7) {
      weight += 100; // 1주일 이내: 최고 가중치
    } else if (daysSinceRelease <= 30) {
      weight += 80; // 1개월 이내: 높은 가중치
    } else if (daysSinceRelease <= 90) {
      weight += 50; // 3개월 이내: 중간 가중치
    } else {
      weight += 10; // 3개월 이상: 낮은 가중치
    }

    // 2. 한국 음악 부스트 (KR 선택 시) - 장르 가중치와 함께
    if (countrySettings.koreanBoost) {
      const isKorean = await isKoreanMusic(album, accessToken);
      if (isKorean) {
        weight += 200; // 한국 음악에 매우 큰 가중치
      }
    }

    // 3. 장르별 가중치 (한국 음악 우선)
    for (const artist of album.artists) {
      const genres = await getArtistGenres(artist.id, accessToken);
      for (const genre of genres) {
        const genreLower = genre.toLowerCase();
        for (const [priorityGenre, genreWeight] of Object.entries(
          countrySettings.genreWeights
        )) {
          if (genreLower.includes(priorityGenre.toLowerCase())) {
            weight += genreWeight * 2; // 장르 가중치 2배 적용
            break;
          }
        }
      }
    }

    // 4. 아티스트 이름 매칭 가중치
    const artistNames = album.artists.map((a) => a.name.toLowerCase());
    for (const keyword of countrySettings.searchKeywords) {
      if (artistNames.some((name) => name.includes(keyword.toLowerCase()))) {
        weight += 10; // 키워드 매칭 가중치 증가
      }
    }

    // 5. 한국 아티스트 특별 가중치
    if (countrySettings.koreanBoost) {
      const artistNames = album.artists.map((a) => a.name.toLowerCase());
      const koreanArtists = [
        "bts",
        "blackpink",
        "twice",
        "red velvet",
        "exo",
        "nct",
        "stray kids",
        "itzy",
        "aespa",
        "newjeans",
        "ive",
        "le sserafim",
      ];

      if (
        artistNames.some((name) =>
          koreanArtists.some((korean) => name.includes(korean))
        )
      ) {
        weight += 150; // 유명 한국 아티스트 추가 가중치
      }
    }

    // 6. 즐겨찾기된 아티스트 가중치 (매우 높은 우선순위)
    const albumArtistIds = album.artists.map((a) => a.id);
    for (const artistId of favoriteArtistIds) {
      if (albumArtistIds.includes(artistId)) {
        weight += 500; // 즐겨찾기된 아티스트의 앨범에 매우 높은 가중치
        console.log(`Favorite artist boost for ${album.name}: +500 weight`);
      }
    }
  } catch (error) {
    console.warn("Error calculating album weight:", error);
  }

  return weight;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "KR";
  const genreFilter = searchParams.get("genre")?.toLowerCase();
  const favoriteArtistIds = searchParams.get("favoriteArtistIds"); // 즐겨찾기된 아티스트 ID들

  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }

  const countrySettings = getCountrySpecificSettings(country);

  // 즐겨찾기된 아티스트 ID 배열로 변환
  const favoriteIds = favoriteArtistIds
    ? favoriteArtistIds.split(",").filter((id) => id.trim())
    : [];

  try {
    let albums: SpotifyAlbum[] = [];
    let artistsWithImages: Array<{ id: string; name: string; image: string }> =
      [];

    if (query) {
      // 검색 쿼리가 있는 경우 - 검색 결과 반환
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album,artist&limit=50`,
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

      // 검색된 아티스트들도 포함
      const searchArtists: Array<{ id: string; name: string }> =
        data.artists?.items?.map((a: { id: string; name: string }) => ({
          id: a.id,
          name: a.name,
        })) || [];
      const searchArtistIds: string[] = searchArtists.map((a) => a.id);
      const imageMap = await getArtistImagesBulk(searchArtistIds, accessToken);
      for (const artist of searchArtists) {
        const image = imageMap.get(artist.id) || "";
        artistsWithImages.push({ id: artist.id, name: artist.name, image });
      }
    } else {
      // 검색 쿼리가 없는 경우 - 즐겨찾기 아티스트 중심으로 신곡 발매
      const allAlbums: SpotifyAlbum[] = [];

      // 1. 즐겨찾기한 아티스트들의 최신 앨범만 가져오기
      if (favoriteIds.length > 0) {
        console.log(
          `Fetching albums from ${favoriteIds.length} favorite artists...`
        );
        for (const artistId of favoriteIds) {
          try {
            const artistAlbumsRes = await fetch(
              `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=20`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (artistAlbumsRes.ok) {
              const artistAlbumsData = await artistAlbumsRes.json();
              const artistAlbums = artistAlbumsData.items || [];

              // 중복 제거하면서 추가
              for (const album of artistAlbums) {
                if (!allAlbums.find((a) => a.id === album.id)) {
                  allAlbums.push(album);
                }
              }
            }
          } catch (error) {
            console.warn(
              `Failed to fetch albums for favorite artist ${artistId}:`,
              error
            );
          }
        }
      } else {
        // 즐겨찾기된 아티스트가 없는 경우 기본 신곡 발매
        const newReleasesRes = await fetch(
          `https://api.spotify.com/v1/browse/new-releases?limit=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (newReleasesRes.ok) {
          const newReleasesData = await newReleasesRes.json();
          allAlbums.push(...(newReleasesData.albums?.items || []));
        }
      }

      // 2. 발매일 기준 필터 완화 (최근 3년)
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const recentAlbums = allAlbums.filter((album) => {
        if (!album.release_date) return true;
        const releaseDate = new Date(album.release_date);
        return releaseDate >= threeYearsAgo;
      });

      console.log(`Total albums before filtering: ${allAlbums.length}`);
      console.log(`Recent albums (1 year): ${recentAlbums.length}`);
      console.log(`Favorite artist IDs: ${favoriteIds.join(", ")}`);

      // 3. 가중치 기반 정렬 (즐겨찾기 아티스트 우선, 최신순)
      const albumsWithWeights = await Promise.all(
        recentAlbums.map(async (album) => ({
          album,
          weight: await calculateAlbumWeight(
            album,
            countrySettings,
            accessToken,
            favoriteIds
          ),
        }))
      );

      // 가중치 순으로 정렬 (높은 가중치가 먼저)
      albumsWithWeights.sort((a, b) => b.weight - a.weight);

      // 앨범만 추출하고 최대 60개로 제한
      albums = albumsWithWeights.slice(0, 60).map((item) => item.album);

      console.log(
        `Final albums for ${country}:`,
        albums.slice(0, 15).map((album) => ({
          name: album.name,
          release_date: album.release_date,
          artists: album.artists.map((a) => a.name),
          weight: albumsWithWeights.find((w) => w.album.id === album.id)
            ?.weight,
          isFavorite: album.artists.some((artist) =>
            favoriteIds.includes(artist.id)
          ),
        }))
      );
    }

    console.log(
      `Fetched ${albums.length} albums for country ${country}:`,
      albums.map((a) => a.name)
    );

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

    // 아티스트 프로필 이미지 수집
    if (artistsWithImages.length === 0) {
      const artistMap = new Map<
        string,
        { id: string; name: string; image: string }
      >();

      // 1. 앨범의 아티스트들 (배치로 이미지 조회)
      const albumArtistIdsSet = new Set<string>();
      for (const album of albums) {
        for (const artist of album.artists) {
          albumArtistIdsSet.add(artist.id);
        }
      }
      const albumArtistIds = Array.from(albumArtistIdsSet);
      const albumImagesMap = await getArtistImagesBulk(
        albumArtistIds,
        accessToken
      );
      for (const album of albums) {
        for (const artist of album.artists) {
          if (!artistMap.has(artist.id)) {
            const image = albumImagesMap.get(artist.id) || "";
            artistMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              image,
            });
          }
        }
      }

      // 2. 즐겨찾기된 아티스트들도 배치로 추가
      const missingFavoriteIds = favoriteIds.filter((id) => !artistMap.has(id));
      if (missingFavoriteIds.length > 0) {
        const favImages = await getArtistImagesBulk(
          missingFavoriteIds,
          accessToken
        );
        // 이름도 필요하므로 여러 아티스트 조회 응답을 다시 받아야 하지만, 위 함수는 이미지 맵만 반환
        // 여기서는 캐시된 이미지를 우선 사용하고, 이름은 API 최소 호출로 보강
        const chunkSize = 50;
        for (let i = 0; i < missingFavoriteIds.length; i += chunkSize) {
          const chunk = missingFavoriteIds.slice(i, i + chunkSize);
          try {
            const res = await fetch(
              `https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!res.ok) continue;
            const data = await res.json();
            for (const artist of data.artists || []) {
              const image =
                favImages.get(artist.id) || artist.images?.[0]?.url || "";
              artistMap.set(artist.id, {
                id: artist.id,
                name: artist.name,
                image,
              });
            }
          } catch (err) {
            console.warn("Failed to batch fetch favorite artists info:", err);
          }
        }
      }

      artistsWithImages = Array.from(artistMap.values());
    }

    console.log(`Artists with images for ${country}:`, artistsWithImages);

    return NextResponse.json({ albums, artists: artistsWithImages, country });
  } catch (err) {
    console.error("Spotify search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
