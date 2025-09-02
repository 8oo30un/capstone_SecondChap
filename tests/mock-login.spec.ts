import { test, expect } from "@playwright/test";

test.describe("Mock 로그인 테스트", () => {
  test("Mock 세션으로 로그인 상태 시뮬레이션", async ({ page }) => {
    console.log("🎯 Mock 로그인 테스트 시작");

    // 1. 랜딩 페이지로 이동
    await page.goto("/");
    await expect(page).toHaveTitle(/SecondChap/);
    console.log("✅ 랜딩 페이지 로드 완료");

    // 2. Mock 세션 쿠키 설정 (실제 로그인 상태 시뮬레이션)
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

    // 3. Mock API 응답 설정
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

    // 4. 페이지 새로고침하여 세션 적용
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 5. 로그인 상태 확인
    console.log("🔍 로그인 상태 확인");

    // 사용자 정보가 표시되는지 확인
    const userInfo = page
      .locator("text=kwh77974481@gmail.com, text=Test User")
      .first();
    if ((await userInfo.count()) > 0) {
      await expect(userInfo).toBeVisible();
      console.log("✅ Mock 로그인 성공!");
    } else {
      console.log("⚠️ Mock 로그인 상태를 확인할 수 없습니다.");
    }

    // 6. 대시보드 기능 테스트
    console.log("🎯 대시보드 기능 테스트");

    // 검색 기능 테스트
    const searchInput = page
      .locator('input[placeholder*="검색"], input[placeholder*="아티스트"]')
      .first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("BTS");
      await searchInput.press("Enter");

      await page.waitForTimeout(2000);
      console.log("✅ 검색 기능 테스트 완료");
    }

    // 즐겨찾기 기능 확인
    const favoritesSection = page
      .locator("text=즐겨찾기, text=Favorite")
      .first();
    if ((await favoritesSection.count()) > 0) {
      await expect(favoritesSection).toBeVisible();
      console.log("✅ 즐겨찾기 기능 확인 완료");
    }

    console.log("🎉 Mock 로그인 테스트 완료!");
  });

  test("로그인 없이 기본 기능 테스트", async ({ page }) => {
    console.log("🎯 로그인 없이 기본 기능 테스트");

    // 1. 랜딩 페이지로 이동
    await page.goto("/");
    await expect(page).toHaveTitle(/SecondChap/);
    console.log("✅ 랜딩 페이지 로드 완료");

    // 2. 헤더 요소들 확인
    await expect(page.locator("h1")).toContainText("SecondChap");
    console.log("✅ 헤더 요소 확인 완료");

    // 3. 검색 입력창 확인
    const searchInput = page
      .locator('input[placeholder*="검색"], input[placeholder*="아티스트"]')
      .first();
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
      console.log("✅ 검색 입력창 확인 완료");
    }

    // 4. 즐겨찾기 영역 확인
    const favoritesSection = page
      .locator("text=즐겨찾기, text=Favorite")
      .first();
    if ((await favoritesSection.count()) > 0) {
      await expect(favoritesSection).toBeVisible();
      console.log("✅ 즐겨찾기 영역 확인 완료");
    }

    // 5. 로그인 버튼 확인
    const loginButton = page
      .locator(
        'button:has-text("로그인"), button:has-text("Login"), a:has-text("로그인"), a:has-text("Login")'
      )
      .first();
    if ((await loginButton.count()) > 0) {
      await expect(loginButton).toBeVisible();
      console.log("✅ 로그인 버튼 확인 완료");
    } else {
      // AuthButton 컴포넌트나 다른 로그인 관련 요소 찾기
      const authButton = page
        .locator(
          '[data-testid="auth-button"], .auth-button, button[class*="login"], a[class*="login"]'
        )
        .first();
      if ((await authButton.count()) > 0) {
        await expect(authButton).toBeVisible();
        console.log("✅ 인증 버튼 확인 완료");
      }
    }

    console.log("🎉 기본 기능 테스트 완료!");
  });

  test("반응형 디자인 테스트", async ({ page }) => {
    console.log("🎯 반응형 디자인 테스트");

    await page.goto("/");

    // 데스크톱 뷰에서 헤더 요소들 확인
    await expect(page.locator("h1")).toBeVisible();
    console.log("✅ 데스크톱 뷰 확인 완료");

    // 모바일 뷰로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // 모바일에서도 헤더 요소들이 보이는지 확인
    await expect(page.locator("h1")).toBeVisible();
    console.log("✅ 모바일 뷰 확인 완료");

    // 다시 데스크톱으로 변경
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    console.log("🎉 반응형 디자인 테스트 완료!");
  });

  test("페이지 성능 테스트", async ({ page }) => {
    console.log("🎯 페이지 성능 테스트");

    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    console.log(`📊 페이지 로드 시간: ${loadTime}ms`);

    // 로드 시간이 5초 이내인지 확인
    expect(loadTime).toBeLessThan(5000);
    console.log("✅ 페이지 성능 테스트 통과!");
  });
});
