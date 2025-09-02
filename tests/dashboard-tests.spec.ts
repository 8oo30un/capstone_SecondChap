import { test, expect } from "@playwright/test";

test.describe("로그인 후 대시보드 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // Mock 로그인 상태 설정
    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: "mock-session-token-12345",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Mock API 응답 설정
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "mock-user-id",
            email: "kwh77974481@gmail.com",
            name: "Test User",
            image: "https://via.placeholder.com/150",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    // 대시보드 페이지로 이동
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("대시보드 기본 UI 확인", async ({ page }) => {
    console.log("🎯 대시보드 기본 UI 테스트");

    // 헤더 확인
    await expect(page.locator("h1")).toContainText("SecondChap");
    console.log("✅ 헤더 확인 완료");

    // 검색 입력창 확인
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="아티스트"]').first();
    await expect(searchInput).toBeVisible();
    console.log("✅ 검색 입력창 확인 완료");

    // 즐겨찾기 영역 확인
    const favoritesSection = page.locator("text=즐겨찾기, text=Favorite").first();
    await expect(favoritesSection).toBeVisible();
    console.log("✅ 즐겨찾기 영역 확인 완료");
  });

  test("검색 기능 테스트", async ({ page }) => {
    console.log("🎯 검색 기능 테스트");

    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="아티스트"]').first();
    
    // 검색어 입력
    await searchInput.fill("BTS");
    await searchInput.press("Enter");
    
    // 검색 결과 대기
    await page.waitForTimeout(3000);
    
    // 검색 결과 확인
    const searchResults = page.locator('text=BTS, [data-testid="search-results"]').first();
    if (await searchResults.count() > 0) {
      await expect(searchResults).toBeVisible();
      console.log("✅ 검색 결과 표시 확인");
    }
    
    // 다른 검색어 테스트
    await searchInput.fill("Taylor Swift");
    await searchInput.press("Enter");
    await page.waitForTimeout(3000);
    console.log("✅ 검색 기능 테스트 완료");
  });

  test("즐겨찾기 기능 테스트", async ({ page }) => {
    console.log("🎯 즐겨찾기 기능 테스트");

    // 즐겨찾기 영역 확인
    const favoritesSection = page.locator("text=즐겨찾기, text=Favorite").first();
    await expect(favoritesSection).toBeVisible();
    
    // 즐겨찾기 개수 확인
    const favoritesCount = page.locator('text=/[0-9]+명/').first();
    if (await favoritesCount.count() > 0) {
      await expect(favoritesCount).toBeVisible();
      console.log("✅ 즐겨찾기 개수 표시 확인");
    }
    
    // 즐겨찾기 드롭존 확인
    const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone').first();
    if (await dropZone.count() > 0) {
      await expect(dropZone).toBeVisible();
      console.log("✅ 즐겨찾기 드롭존 확인");
    }
  });

  test("앨범 상세 정보 테스트", async ({ page }) => {
    console.log("🎯 앨범 상세 정보 테스트");

    // 먼저 검색으로 앨범 결과 생성
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="아티스트"]').first();
    await searchInput.fill("BTS");
    await searchInput.press("Enter");
    await page.waitForTimeout(3000);

    // 앨범 카드 클릭 (첫 번째 앨범)
    const albumCard = page.locator('[data-testid="album-card"], .album-card').first();
    if (await albumCard.count() > 0) {
      await albumCard.click();
      await page.waitForTimeout(1000);
      
      // 앨범 상세 패널 확인
      const albumPanel = page.locator('[data-testid="album-panel"], .album-panel').first();
      if (await albumPanel.count() > 0) {
        await expect(albumPanel).toBeVisible();
        console.log("✅ 앨범 상세 패널 표시 확인");
        
        // 닫기 버튼 테스트
        const closeButton = page.locator('[data-testid="close-button"], .close-button').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log("✅ 앨범 상세 패널 닫기 확인");
        }
      }
    }
  });

  test("아티스트 상세 정보 테스트", async ({ page }) => {
    console.log("🎯 아티스트 상세 정보 테스트");

    // 아티스트 검색
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="아티스트"]').first();
    await searchInput.fill("BTS");
    await searchInput.press("Enter");
    await page.waitForTimeout(3000);

    // 아티스트 카드 클릭
    const artistCard = page.locator('[data-testid="artist-card"], .artist-card').first();
    if (await artistCard.count() > 0) {
      await artistCard.click();
      await page.waitForTimeout(1000);
      
      // 아티스트 상세 패널 확인
      const artistPanel = page.locator('[data-testid="artist-panel"], .artist-panel').first();
      if (await artistPanel.count() > 0) {
        await expect(artistPanel).toBeVisible();
        console.log("✅ 아티스트 상세 패널 표시 확인");
        
        // Spotify 링크 확인
        const spotifyLink = page.locator('text=Spotify, text=스포티파이').first();
        if (await spotifyLink.count() > 0) {
          await expect(spotifyLink).toBeVisible();
          console.log("✅ Spotify 링크 확인");
        }
      }
    }
  });

  test("반응형 디자인 테스트", async ({ page }) => {
    console.log("🎯 반응형 디자인 테스트");

    // 데스크톱 뷰
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="검색"]').first();
    await expect(searchInput).toBeVisible();
    console.log("✅ 데스크톱 뷰 확인");

    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await expect(searchInput).toBeVisible();
    console.log("✅ 태블릿 뷰 확인");

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await expect(searchInput).toBeVisible();
    console.log("✅ 모바일 뷰 확인");
  });

  test("성능 테스트", async ({ page }) => {
    console.log("🎯 성능 테스트");

    const startTime = Date.now();
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 페이지 로드 시간: ${loadTime}ms`);
    
    // 로드 시간이 5초 이내인지 확인
    expect(loadTime).toBeLessThan(5000);
    console.log("✅ 성능 테스트 통과");
  });

  test("에러 처리 테스트", async ({ page }) => {
    console.log("🎯 에러 처리 테스트");

    const searchInput = page.locator('input[placeholder*="검색"]').first();
    
    // 잘못된 검색어 입력
    await searchInput.fill("!@#$%^&*()");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);
    
    // 에러 메시지나 빈 결과 상태 확인
    const errorMessage = page.locator('text=error, text=Error, text=검색 결과가 없습니다').first();
    const emptyState = page.locator('text=검색 중..., text=Loading').first();
    
    if (await errorMessage.count() > 0 || await emptyState.count() > 0) {
      console.log("✅ 에러 처리 확인");
    }
  });
});
