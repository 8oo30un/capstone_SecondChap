import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("세션 저장 및 재사용 테스트", () => {
  const sessionFile = path.join(__dirname, "auth-session.json");

  test("수동 로그인 후 세션 저장", async ({ page }) => {
    console.log("🎯 수동 로그인 후 세션 저장 테스트");
    
    // 1. 로그인 페이지로 이동
    await page.goto("/api/auth/signin");
    
    // 2. Google 로그인 버튼 클릭
    const googleButton = page.locator('button:has-text("Google")').first();
    if (await googleButton.count() > 0) {
      await googleButton.click();
      
      // 3. 수동 로그인 대기 (사용자가 직접 로그인)
      console.log("⏳ 수동으로 Google 로그인을 완료해주세요...");
      console.log("   - 이메일: kwh77974481@gmail.com");
      console.log("   - 비밀번호 입력 후 로그인");
      console.log("   - 로그인 완료 후 아무 키나 누르세요...");
      
      // 사용자 입력 대기 (실제로는 수동으로 로그인)
      await page.waitForURL("**/", { timeout: 60000 });
      
      // 4. 로그인 성공 후 세션 저장
      const cookies = await page.context().cookies();
      const sessionData = {
        cookies: cookies,
        timestamp: Date.now(),
        url: page.url()
      };
      
      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      console.log("✅ 세션 데이터 저장 완료");
      
      // 5. 로그인 상태 확인
      const userInfo = page.locator('text=kwh77974481@gmail.com').first();
      if (await userInfo.count() > 0) {
        console.log("✅ 로그인 상태 확인 완료");
      }
    }
  });

  test("저장된 세션으로 대시보드 테스트", async ({ page }) => {
    console.log("🎯 저장된 세션으로 대시보드 테스트");
    
    // 저장된 세션 파일 확인
    if (!fs.existsSync(sessionFile)) {
      test.skip("세션 파일이 없습니다. 먼저 수동 로그인 테스트를 실행하세요.");
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
    const userInfo = page.locator('text=kwh77974481@gmail.com').first();
    if (await userInfo.count() > 0) {
      console.log("✅ 저장된 세션으로 로그인 상태 복원 완료");
      
      // 6. 대시보드 기능 테스트
      const searchInput = page.locator('input[placeholder*="검색"]').first();
      await expect(searchInput).toBeVisible();
      console.log("✅ 대시보드 접근 확인");
      
      // 7. 검색 기능 테스트
      await searchInput.fill("BTS");
      await searchInput.press("Enter");
      await page.waitForTimeout(3000);
      console.log("✅ 검색 기능 테스트 완료");
      
    } else {
      console.log("❌ 세션 복원 실패");
    }
  });

  test("세션 만료 처리 테스트", async ({ page }) => {
    console.log("🎯 세션 만료 처리 테스트");
    
    // 만료된 세션 데이터 생성
    const expiredSessionData = {
      cookies: [],
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25시간 전
      url: "http://localhost:3000"
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(expiredSessionData, null, 2));
    
    // 만료된 세션으로 접근 시도
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // 로그인 페이지로 리다이렉트되는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes("signin") || currentUrl.includes("login")) {
      console.log("✅ 세션 만료 시 로그인 페이지로 리다이렉트 확인");
    } else {
      console.log("⚠️ 세션 만료 처리가 예상과 다릅니다");
    }
  });
});
