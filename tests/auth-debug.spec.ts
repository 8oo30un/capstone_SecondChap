import { test, expect } from "@playwright/test";

test.describe("인증 디버깅 테스트", () => {
  test("Google OAuth 설정 확인", async ({ page }) => {
    console.log("🎯 Google OAuth 설정 확인");

    // 1. 로그인 페이지로 직접 이동
    await page.goto("/api/auth/signin");
    await page.waitForLoadState("networkidle");

    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 3. Google 로그인 버튼 확인
    const googleButton = page
      .locator('button:has-text("Google"), a:has-text("Google")')
      .first();

    if ((await googleButton.count()) > 0) {
      console.log("✅ Google 로그인 버튼 발견");

      // 4. 버튼 클릭 전 URL 확인
      const currentUrl = page.url();
      console.log(`🔗 현재 URL: ${currentUrl}`);

      // 5. Google 로그인 버튼 클릭
      await googleButton.click();
      await page.waitForLoadState("networkidle");

      // 6. 리다이렉트된 URL 확인
      const redirectedUrl = page.url();
      console.log(`🔗 리다이렉트된 URL: ${redirectedUrl}`);

      // 7. URL 분석
      if (redirectedUrl.includes("accounts.google.com")) {
        console.log("✅ Google OAuth 페이지로 정상 리다이렉트됨");

        if (redirectedUrl.includes("signin/rejected")) {
          console.log("❌ Google에서 로그인을 거부함 - 자동화 도구로 인식됨");
          console.log("💡 해결 방법:");
          console.log("   1. 실제 브라우저에서 수동 로그인 테스트");
          console.log("   2. Google OAuth 앱 설정에서 테스트 도메인 추가");
          console.log("   3. Mock 로그인 사용");
        } else if (redirectedUrl.includes("signin")) {
          console.log("✅ Google 로그인 페이지 정상 로드");
        }
      } else {
        console.log("❌ 예상치 못한 리다이렉트");
      }
    } else {
      console.log("❌ Google 로그인 버튼을 찾을 수 없음");
    }
  });

  test("NextAuth 설정 확인", async ({ page }) => {
    console.log("🎯 NextAuth 설정 확인");

    // 1. NextAuth API 엔드포인트 확인
    const endpoints = [
      "/api/auth/signin",
      "/api/auth/session",
      "/api/auth/providers",
      "/api/auth/csrf",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.goto(`http://localhost:3000${endpoint}`);
        const status = response?.status();
        console.log(`📡 ${endpoint}: ${status}`);

        if (status === 200) {
          console.log(`✅ ${endpoint} 정상 응답`);
        } else {
          console.log(`❌ ${endpoint} 오류: ${status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} 요청 실패: ${error}`);
      }
    }
  });

  test("환경변수 확인", async ({ page }) => {
    console.log("🎯 환경변수 확인");

    // 1. NextAuth 설정 페이지로 이동
    await page.goto("/api/auth/providers");

    try {
      const response = await page.waitForResponse("**/api/auth/providers");
      const data = await response.json();

      console.log("📋 사용 가능한 프로바이더:");
      Object.keys(data).forEach((provider) => {
        console.log(`   - ${provider}: ${data[provider].name}`);
      });

      // Google 프로바이더 확인
      if (data.google) {
        console.log("✅ Google 프로바이더 설정됨");
        console.log(
          `   - Client ID: ${data.google.clientId ? "설정됨" : "설정되지 않음"}`
        );
      } else {
        console.log("❌ Google 프로바이더 설정되지 않음");
      }
    } catch (error) {
      console.log("❌ 프로바이더 정보를 가져올 수 없음:", error);
    }
  });

  test("쿠키 및 세션 확인", async ({ page }) => {
    console.log("🎯 쿠키 및 세션 확인");

    // 1. 메인 페이지로 이동
    await page.goto("/");

    // 2. 현재 쿠키 확인
    const cookies = await page.context().cookies();
    console.log("🍪 현재 쿠키:");
    cookies.forEach((cookie) => {
      if (cookie.name.includes("auth") || cookie.name.includes("session")) {
        console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
      }
    });

    // 3. 세션 API 호출
    try {
      const response = await page.request.get("/api/auth/session");
      const sessionData = await response.json();

      if (sessionData.user) {
        console.log("✅ 활성 세션 발견:");
        console.log(
          `   - 사용자: ${sessionData.user.email || sessionData.user.name}`
        );
      } else {
        console.log("❌ 활성 세션 없음");
      }
    } catch (error) {
      console.log("❌ 세션 정보를 가져올 수 없음:", error);
    }
  });

  test("네트워크 요청 모니터링", async ({ page }) => {
    console.log("🎯 네트워크 요청 모니터링");

    const requests: string[] = [];
    const responses: string[] = [];

    // 요청 모니터링
    page.on("request", (request) => {
      if (request.url().includes("auth") || request.url().includes("google")) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });

    // 응답 모니터링
    page.on("response", (response) => {
      if (
        response.url().includes("auth") ||
        response.url().includes("google")
      ) {
        responses.push(`${response.status()} ${response.url()}`);
      }
    });

    // 로그인 플로우 실행
    await page.goto("/api/auth/signin");
    await page.waitForLoadState("networkidle");

    const googleButton = page.locator('button:has-text("Google")').first();
    if ((await googleButton.count()) > 0) {
      await googleButton.click();
      await page.waitForTimeout(3000);
    }

    // 결과 출력
    console.log("📤 요청 목록:");
    requests.forEach((req) => console.log(`   ${req}`));

    console.log("📥 응답 목록:");
    responses.forEach((res) => console.log(`   ${res}`));
  });
});
