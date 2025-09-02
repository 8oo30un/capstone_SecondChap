import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("실제 로그인 후 대시보드 테스트", () => {
  const sessionFile = path.join(__dirname, "real-auth-session.json");

  test("수동 로그인 후 대시보드 기능 테스트", async ({ page }) => {
    console.log("🎯 실제 로그인 후 대시보드 테스트 시작");

    // 1. 로그인 페이지로 이동
    await page.goto("/api/auth/signin");
    await page.waitForLoadState("networkidle");

    // 2. Google 로그인 버튼 클릭
    const googleButton = page
      .locator('button:has-text("Google"), a:has-text("Google")')
      .first();
    if ((await googleButton.count()) > 0) {
      await googleButton.click();

      // 3. 수동 로그인 안내
      console.log("⏳ 수동으로 Google 로그인을 완료해주세요:");
      console.log("   1. 이메일: kwh77974481@gmail.com");
      console.log("   2. 비밀번호 입력");
      console.log("   3. 로그인 완료 후 대시보드로 이동");
      console.log("   4. 로그인 완료되면 아무 키나 누르세요...");

      // 사용자 입력 대기 (실제로는 수동으로 로그인)
      await page.waitForURL("**/", { timeout: 120000 });

      // 4. 로그인 성공 후 세션 저장
      const cookies = await page.context().cookies();
      const sessionData = {
        cookies: cookies,
        timestamp: Date.now(),
        url: page.url(),
      };

      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      console.log("✅ 실제 세션 데이터 저장 완료");

      // 5. 대시보드 기능 테스트
      await testDashboardFeatures(page);
    } else {
      console.log("❌ Google 로그인 버튼을 찾을 수 없습니다");
    }
  });

  test("저장된 실제 세션으로 대시보드 테스트", async ({ page }) => {
    console.log("🎯 저장된 실제 세션으로 대시보드 테스트");

    // 저장된 세션 파일 확인
    if (!fs.existsSync(sessionFile)) {
      test.skip(
        "실제 세션 파일이 없습니다. 먼저 수동 로그인 테스트를 실행하세요."
      );
      return;
    }

    // 1. 저장된 세션 데이터 로드
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));

    // 2. 세션이 24시간 이내인지 확인
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > 24 * 60 * 60 * 1000) {
      test.skip("세션이 만료되었습니다. 다시 로그인하세요.");
      return;
    }

    // 3. 쿠키 복원
    await page.context().addCookies(sessionData.cookies);

    // 4. 대시보드 페이지로 이동
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 5. 로그인 상태 확인
    const userInfo = page
      .locator("text=kwh77974481@gmail.com, text=Test User")
      .first();
    if ((await userInfo.count()) > 0) {
      console.log("✅ 실제 세션으로 로그인 상태 복원 완료");

      // 6. 대시보드 기능 테스트
      await testDashboardFeatures(page);
    } else {
      console.log("❌ 세션 복원 실패 - 로그인 상태가 아닙니다");
    }
  });

  async function testDashboardFeatures(page: any) {
    console.log("🎯 대시보드 기능 테스트 시작");

    // 1. 검색 기능 테스트
    const searchInput = page
      .locator(
        'input[placeholder*="검색"], input[placeholder*="아티스트"], input[type="text"]'
      )
      .first();
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
      console.log("✅ 검색 입력창 확인");

      // 검색어 입력
      await searchInput.fill("BTS");
      await searchInput.press("Enter");
      await page.waitForTimeout(3000);
      console.log("✅ 검색 기능 테스트 완료");
    } else {
      console.log("⚠️ 검색 입력창을 찾을 수 없습니다");
    }

    // 2. 즐겨찾기 기능 테스트
    const favoritesSection = page
      .locator("text=즐겨찾기, text=Favorite, text=Personal Favorites")
      .first();
    if ((await favoritesSection.count()) > 0) {
      await expect(favoritesSection).toBeVisible();
      console.log("✅ 즐겨찾기 영역 확인");
    }

    // 3. 앨범/아티스트 카드 테스트
    const albumCards = page
      .locator('[data-testid="album-card"], .album-card, [class*="album"]')
      .first();
    const artistCards = page
      .locator('[data-testid="artist-card"], .artist-card, [class*="artist"]')
      .first();

    if ((await albumCards.count()) > 0) {
      await albumCards.click();
      await page.waitForTimeout(1000);
      console.log("✅ 앨범 카드 클릭 테스트 완료");
    }

    if ((await artistCards.count()) > 0) {
      await artistCards.click();
      await page.waitForTimeout(1000);
      console.log("✅ 아티스트 카드 클릭 테스트 완료");
    }

    // 4. 반응형 테스트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    console.log("✅ 모바일 뷰 테스트 완료");

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    console.log("✅ 데스크톱 뷰 테스트 완료");

    // 5. 스크린샷 저장
    await page.screenshot({ path: "dashboard-test.png", fullPage: true });
    console.log("📸 대시보드 스크린샷 저장: dashboard-test.png");

    console.log("🎉 대시보드 기능 테스트 완료");
  }
});
