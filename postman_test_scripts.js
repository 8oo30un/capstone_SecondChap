// Postman Test Scripts for SecondChap API
// 이 스크립트들을 Postman의 Tests 탭에서 사용할 수 있습니다.

// ========================================
// 1. 기본 응답 검증
// ========================================

// 상태 코드 검증
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// 응답 시간 검증 (2초 이내)
pm.test("Response time is less than 2000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});

// JSON 응답 형식 검증
pm.test("Response is valid JSON", function () {
  pm.response.to.be.json;
});

// ========================================
// 2. Spotify Token API 테스트
// ========================================

pm.test("Spotify token response has required fields", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("access_token");
  pm.expect(jsonData).to.have.property("token_type");
  pm.expect(jsonData).to.have.property("expires_in");
  pm.expect(jsonData.token_type).to.eql("Bearer");
  pm.expect(jsonData.expires_in).to.be.a("number");
});

// 토큰을 환경 변수에 자동 저장
pm.test("Save access token to environment", function () {
  if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("accessToken", response.access_token);
    console.log("✅ Spotify token saved to environment");
  }
});

// ========================================
// 3. Search API 테스트
// ========================================

pm.test("Search response has albums and artists", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("albums");
  pm.expect(jsonData).to.have.property("artists");
  pm.expect(jsonData.albums).to.be.an("array");
  pm.expect(jsonData.artists).to.be.an("array");
});

pm.test("Albums have required properties", function () {
  const jsonData = pm.response.json();
  if (jsonData.albums.length > 0) {
    const album = jsonData.albums[0];
    pm.expect(album).to.have.property("id");
    pm.expect(album).to.have.property("name");
    pm.expect(album).to.have.property("artists");
    pm.expect(album.artists).to.be.an("array");
  }
});

pm.test("Artists have required properties", function () {
  const jsonData = pm.response.json();
  if (jsonData.artists.length > 0) {
    const artist = jsonData.artists[0];
    pm.expect(artist).to.have.property("id");
    pm.expect(artist).to.have.property("name");
  }
});

// ========================================
// 4. Favorites API 테스트 (인증 필요)
// ========================================

pm.test("Favorites response is array", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

pm.test("Favorite items have required properties", function () {
  const jsonData = pm.response.json();
  if (jsonData.length > 0) {
    const favorite = jsonData[0];
    pm.expect(favorite).to.have.property("id");
    pm.expect(favorite).to.have.property("type");
    pm.expect(favorite).to.have.property("spotifyId");
    pm.expect(favorite).to.have.property("name");
    pm.expect(favorite.type).to.be.oneOf(["album", "artist"]);
  }
});

// ========================================
// 5. 에러 응답 테스트
// ========================================

pm.test("Error response has error message", function () {
  if (pm.response.code >= 400) {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("error");
    pm.expect(jsonData.error).to.be.a("string");
  }
});

pm.test("401 Unauthorized for protected endpoints", function () {
  if (pm.response.code === 401) {
    const jsonData = pm.response.json();
    pm.expect(jsonData.error).to.include("로그인이 필요");
  }
});

// ========================================
// 6. 성능 및 데이터 품질 테스트
// ========================================

pm.test("Response size is reasonable", function () {
  const responseSize = pm.response.responseSize;
  pm.expect(responseSize).to.be.below(1000000); // 1MB 이하
});

pm.test("No empty arrays for search results", function () {
  const jsonData = pm.response.json();
  if (pm.request.url.query.has("q")) {
    // 검색 쿼리가 있는 경우 빈 결과가 아닌지 확인
    pm.expect(jsonData.albums.length + jsonData.artists.length).to.be.above(0);
  }
});

// ========================================
// 7. 한국 음악 특화 테스트
// ========================================

pm.test("Korean music boost works for KR country", function () {
  const jsonData = pm.response.json();
  const country = pm.request.url.query.get("country");

  if (country === "KR" && jsonData.albums.length > 0) {
    // 한국 아티스트가 포함되어 있는지 확인
    const hasKoreanArtist = jsonData.albums.some((album) =>
      album.artists.some(
        (artist) =>
          artist.name.toLowerCase().includes("korean") ||
          artist.name.toLowerCase().includes("k-pop") ||
          artist.name.toLowerCase().includes("bts") ||
          artist.name.toLowerCase().includes("blackpink")
      )
    );

    if (hasKoreanArtist) {
      console.log("✅ Korean music boost detected");
    }
  }
});

// ========================================
// 8. 즐겨찾기 아티스트 우선순위 테스트
// ========================================

pm.test("Favorite artists have priority", function () {
  const jsonData = pm.response.json();
  const favoriteArtistIds = pm.request.url.query.get("favoriteArtistIds");

  if (favoriteArtistIds && jsonData.albums.length > 0) {
    const favoriteIds = favoriteArtistIds.split(",");
    const hasFavoriteArtist = jsonData.albums.some((album) =>
      album.artists.some((artist) => favoriteIds.includes(artist.id))
    );

    if (hasFavoriteArtist) {
      console.log("✅ Favorite artist priority detected");
    }
  }
});

// ========================================
// 9. 데이터 일관성 테스트
// ========================================

pm.test("Album and artist IDs are valid", function () {
  const jsonData = pm.response.json();

  // 앨범 ID 검증
  jsonData.albums.forEach((album) => {
    pm.expect(album.id).to.match(/^[a-zA-Z0-9]+$/);
    pm.expect(album.name).to.be.a("string");
    pm.expect(album.name.length).to.be.above(0);
  });

  // 아티스트 ID 검증
  jsonData.artists.forEach((artist) => {
    pm.expect(artist.id).to.match(/^[a-zA-Z0-9]+$/);
    pm.expect(artist.name).to.be.a("string");
    pm.expect(artist.name.length).to.be.above(0);
  });
});

// ========================================
// 10. 로깅 및 디버깅
// ========================================

// 응답 데이터 로깅
pm.test("Log response data for debugging", function () {
  const jsonData = pm.response.json();
  console.log("📊 Response Summary:");
  console.log("- Status:", pm.response.code);
  console.log("- Response Time:", pm.response.responseTime + "ms");
  console.log("- Albums Count:", jsonData.albums?.length || 0);
  console.log("- Artists Count:", jsonData.artists?.length || 0);

  if (jsonData.albums?.length > 0) {
    console.log("- First Album:", jsonData.albums[0].name);
  }
  if (jsonData.artists?.length > 0) {
    console.log("- First Artist:", jsonData.artists[0].name);
  }
});

// 요청 정보 로깅
pm.test("Log request details", function () {
  console.log("🔍 Request Details:");
  console.log("- URL:", pm.request.url.toString());
  console.log("- Method:", pm.request.method);
  console.log("- Headers:", JSON.stringify(pm.request.headers, null, 2));

  if (pm.request.body && pm.request.body.raw) {
    console.log("- Body:", pm.request.body.raw);
  }
});

// ========================================
// 11. 환경 변수 관리
// ========================================

// 테스트 결과를 환경 변수에 저장
pm.test("Save test results to environment", function () {
  const jsonData = pm.response.json();

  if (pm.response.code === 200) {
    pm.environment.set("lastTestTime", new Date().toISOString());
    pm.environment.set("lastResponseTime", pm.response.responseTime);

    if (jsonData.albums?.length > 0) {
      pm.environment.set("lastAlbumId", jsonData.albums[0].id);
    }
    if (jsonData.artists?.length > 0) {
      pm.environment.set("lastArtistId", jsonData.artists[0].id);
    }
  }
});

// ========================================
// 12. 조건부 테스트
// ========================================

// 특정 조건에서만 실행되는 테스트
pm.test("Conditional test based on response", function () {
  const jsonData = pm.response.json();

  // 검색 결과가 있을 때만 실행
  if (jsonData.albums?.length > 0) {
    pm.test("Search results are relevant", function () {
      const query = pm.request.url.query.get("q");
      if (query) {
        const hasRelevantResult = jsonData.albums.some(
          (album) =>
            album.name.toLowerCase().includes(query.toLowerCase()) ||
            album.artists.some((artist) =>
              artist.name.toLowerCase().includes(query.toLowerCase())
            )
        );
        pm.expect(hasRelevantResult).to.be.true;
      }
    });
  }
});

// ========================================
// 사용법:
// 1. Postman에서 요청을 선택
// 2. Tests 탭으로 이동
// 3. 위의 스크립트 중 필요한 부분을 복사해서 붙여넣기
// 4. Send 버튼 클릭하여 테스트 실행
// 5. Test Results 탭에서 결과 확인
// ========================================




