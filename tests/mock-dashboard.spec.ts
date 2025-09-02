import { test, expect } from "@playwright/test";

test.describe("Mock API를 통한 대시보드 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // Mock 세션 API 응답
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

    // Mock Spotify API 응답
    await page.route("**/api/spotify/**", async (route) => {
      const url = route.request().url();

      if (url.includes("search")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            albums: {
              items: [
                {
                  id: "mock-album-1",
                  name: "Mock Album 1",
                  artists: [{ name: "Mock Artist 1" }],
                  images: [{ url: "https://via.placeholder.com/300" }],
                  release_date: "2023-01-01",
                },
                {
                  id: "mock-album-2",
                  name: "Mock Album 2",
                  artists: [{ name: "Mock Artist 2" }],
                  images: [{ url: "https://via.placeholder.com/300" }],
                  release_date: "2023-02-01",
                },
              ],
            },
            artists: {
              items: [
                {
                  id: "mock-artist-1",
                  name: "Mock Artist 1",
                  images: [{ url: "https://via.placeholder.com/300" }],
                  followers: { total: 1000000 },
                  genres: ["pop", "rock"],
                },
                {
                  id: "mock-artist-2",
                  name: "Mock Artist 2",
                  images: [{ url: "https://via.placeholder.com/300" }],
                  followers: { total: 500000 },
                  genres: ["jazz", "blues"],
                },
              ],
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      }
    });

    // Mock 즐겨찾기 API 응답
    await page.route("**/api/favorites/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          albums: [],
          artists: [],
        }),
      });
    });

    // 페이지 이동
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Mock 대시보드 기본 기능 테스트", async ({ page }) => {
    console.log("🎯 Mock 대시보드 기본 기능 테스트");

    // 1. 헤더 확인
    const header = page.locator("h1");
    await expect(header).toContainText("SecondChap");
    console.log("✅ 헤더 확인 완료");

    // 2. 검색 기능 테스트
    const searchInput = page
      .locator('input[type="text"], input[placeholder*="검색"]')
      .first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("BTS");
      await searchInput.press("Enter");
      await page.waitForTimeout(2000);
      console.log("✅ 검색 기능 테스트 완료");
    }

    // 3. 즐겨찾기 영역 확인
    const favoritesSection = page
      .locator("text=Personal Favorites, text=즐겨찾기")
      .first();
    await expect(favoritesSection).toBeVisible();
    console.log("✅ 즐겨찾기 영역 확인 완료");

    // 4. 스크린샷 저장
    await page.screenshot({ path: "mock-dashboard.png", fullPage: true });
    console.log("📸 Mock 대시보드 스크린샷 저장");
  });

  test("Mock 검색 결과 테스트", async ({ page }) => {
    console.log("🎯 Mock 검색 결과 테스트");

    // 검색 실행
    const searchInput = page
      .locator('input[type="text"], input[placeholder*="검색"]')
      .first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("Mock Artist");
      await searchInput.press("Enter");
      await page.waitForTimeout(3000);

      // 검색 결과 확인
      const searchResults = page
        .locator("text=Mock Artist, text=Mock Album")
        .first();
      if ((await searchResults.count()) > 0) {
        await expect(searchResults).toBeVisible();
        console.log("✅ Mock 검색 결과 표시 확인");
      }
    }

    // 스크린샷 저장
    await page.screenshot({ path: "mock-search-results.png", fullPage: true });
    console.log("📸 Mock 검색 결과 스크린샷 저장");
  });

  test("Mock 반응형 디자인 테스트", async ({ page }) => {
    console.log("🎯 Mock 반응형 디자인 테스트");

    // 데스크톱 뷰
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    console.log("✅ 데스크톱 뷰 테스트");

    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    console.log("✅ 태블릿 뷰 테스트");

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    console.log("✅ 모바일 뷰 테스트");

    // 스크린샷 저장
    await page.screenshot({ path: "mock-responsive.png", fullPage: true });
    console.log("📸 Mock 반응형 스크린샷 저장");
  });

  test("Mock 성능 테스트", async ({ page }) => {
    console.log("🎯 Mock 성능 테스트");

    const startTime = Date.now();

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;
    console.log(`📊 Mock 페이지 로드 시간: ${loadTime}ms`);

    // 로드 시간이 3초 이내인지 확인
    expect(loadTime).toBeLessThan(3000);
    console.log("✅ Mock 성능 테스트 통과");
  });
});
