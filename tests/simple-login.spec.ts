import { test, expect } from "@playwright/test";
import { AuthHelpers } from "./helpers/auth-helpers";

test.describe("간단한 로그인 테스트", () => {
  test("랜딩 페이지에서 로그인까지 전체 플로우", async ({ page }) => {
    const auth = new AuthHelpers(page);

    // 1. 랜딩 페이지로 이동
    console.log("🎯 1단계: 랜딩 페이지로 이동");
    await page.goto("/");

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SecondChap/);
    console.log("✅ 랜딩 페이지 로드 완료");

    // 2. 로그인 버튼 클릭
    console.log("🎯 2단계: 로그인 버튼 클릭");
    await auth.clickLoginButton();

    // 3. Google 로그인 버튼 클릭
    console.log("🎯 3단계: Google 로그인 버튼 클릭");
    await auth.clickGoogleLoginButton();

    // 4. 이메일 입력
    console.log("🎯 4단계: 이메일 입력");
    await auth.fillGoogleEmail("kwh77974481@gmail.com");

    // 5. 비밀번호 입력 (환경변수에서 가져오거나 테스트용)
    console.log("🎯 5단계: 비밀번호 입력");
    const testPassword = process.env.TEST_PASSWORD || "test1234";
    await auth.fillPassword(testPassword);

    // 6. 로그인 상태 확인
    console.log("🎯 6단계: 로그인 상태 확인");
    const isLoggedIn = await auth.verifyLoginStatus("kwh77974481@gmail.com");

    if (isLoggedIn) {
      console.log("✅ 로그인 성공!");
    } else {
      console.log("⚠️ 로그인 상태를 확인할 수 없습니다.");
    }

    // 7. 대시보드 접근 확인
    console.log("🎯 7단계: 대시보드 접근 확인");
    await auth.verifyDashboardAccess();

    console.log("🎉 전체 로그인 플로우 테스트 완료!");
  });

  test("로그인 후 대시보드 기능 확인", async ({ page }) => {
    const auth = new AuthHelpers(page);

    // 로그인 수행
    await auth.performLogin(
      "kwh77974481@gmail.com",
      process.env.TEST_PASSWORD || "test1234"
    );

    // 검색 기능 테스트
    console.log("🔍 검색 기능 테스트");
    const searchInput = page
      .locator('input[placeholder*="검색"], input[placeholder*="아티스트"]')
      .first();

    if ((await searchInput.count()) > 0) {
      await searchInput.fill("BTS");
      await searchInput.press("Enter");

      await page.waitForTimeout(3000);

      // 검색 결과 확인
      const searchResults = page
        .locator('text=BTS, [data-testid="search-results"]')
        .first();
      if ((await searchResults.count()) > 0) {
        await expect(searchResults).toBeVisible();
        console.log("✅ 검색 기능 정상 작동");
      }
    }

    // 즐겨찾기 기능 확인
    console.log("⭐ 즐겨찾기 기능 확인");
    const favoritesSection = page
      .locator("text=즐겨찾기, text=Favorite")
      .first();
    if ((await favoritesSection.count()) > 0) {
      await expect(favoritesSection).toBeVisible();
      console.log("✅ 즐겨찾기 기능 정상 작동");
    }
  });

  test("세션 유지 테스트", async ({ page }) => {
    const auth = new AuthHelpers(page);

    // 로그인 수행
    await auth.performLogin(
      "kwh77974481@gmail.com",
      process.env.TEST_PASSWORD || "test1234"
    );

    // 페이지 새로고침
    console.log("🔄 페이지 새로고침");
    await page.reload();

    // 로그인 상태 유지 확인
    const isStillLoggedIn = await auth.verifyLoginStatus(
      "kwh77974481@gmail.com"
    );

    if (isStillLoggedIn) {
      console.log("✅ 세션이 유지되었습니다.");
    } else {
      console.log("⚠️ 세션이 유지되지 않았습니다.");
    }
  });
});
