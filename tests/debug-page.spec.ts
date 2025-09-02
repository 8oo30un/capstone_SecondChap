import { test, expect } from "@playwright/test";

test.describe("페이지 구조 디버깅", () => {
  test("페이지 구조 확인", async ({ page }) => {
    console.log("🎯 페이지 구조 디버깅 시작");

    // 1. 메인 페이지로 이동
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 3. 현재 URL 확인
    const currentUrl = page.url();
    console.log(`🔗 현재 URL: ${currentUrl}`);

    // 4. 모든 h1 태그 확인
    const h1Elements = await page.locator("h1").all();
    console.log(`📝 h1 태그 개수: ${h1Elements.length}`);
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`   h1[${i}]: "${text}"`);
    }

    // 5. 모든 input 태그 확인
    const inputElements = await page.locator("input").all();
    console.log(`🔍 input 태그 개수: ${inputElements.length}`);
    for (let i = 0; i < inputElements.length; i++) {
      const placeholder = await inputElements[i].getAttribute("placeholder");
      const type = await inputElements[i].getAttribute("type");
      console.log(
        `   input[${i}]: type="${type}", placeholder="${placeholder}"`
      );
    }

    // 6. 즐겨찾기 관련 텍스트 찾기
    const favoriteTexts = await page
      .locator("text=/즐겨찾기|Favorite|favorite/i")
      .all();
    console.log(`⭐ 즐겨찾기 관련 텍스트 개수: ${favoriteTexts.length}`);
    for (let i = 0; i < favoriteTexts.length; i++) {
      const text = await favoriteTexts[i].textContent();
      console.log(`   즐겨찾기[${i}]: "${text}"`);
    }

    // 7. 로그인 관련 요소 찾기
    const loginElements = await page
      .locator("text=/로그인|Login|login/i")
      .all();
    console.log(`🔐 로그인 관련 요소 개수: ${loginElements.length}`);
    for (let i = 0; i < loginElements.length; i++) {
      const text = await loginElements[i].textContent();
      console.log(`   로그인[${i}]: "${text}"`);
    }

    // 8. 페이지 전체 HTML 구조 일부 확인
    const bodyText = await page.locator("body").textContent();
    console.log(`📄 페이지 본문 길이: ${bodyText?.length} 문자`);
    console.log(`📄 페이지 본문 일부: "${bodyText?.substring(0, 200)}..."`);

    // 9. 스크린샷 저장
    await page.screenshot({ path: "debug-page.png", fullPage: true });
    console.log("📸 스크린샷 저장: debug-page.png");

    console.log("🎉 페이지 구조 디버깅 완료");
  });

  test("Mock 세션 테스트", async ({ page }) => {
    console.log("🎯 Mock 세션 테스트 시작");

    // Mock 세션 쿠키 설정
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

    // 페이지 이동
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 세션 API 호출 확인
    const sessionResponse = await page.request.get("/api/auth/session");
    const sessionData = await sessionResponse.json();
    console.log("🔐 세션 데이터:", sessionData);

    // 사용자 정보 확인
    const userInfo = page
      .locator("text=kwh77974481@gmail.com, text=Test User")
      .first();
    if ((await userInfo.count()) > 0) {
      console.log("✅ Mock 사용자 정보 표시됨");
    } else {
      console.log("❌ Mock 사용자 정보 표시되지 않음");
    }

    // 스크린샷 저장
    await page.screenshot({ path: "debug-mock-session.png", fullPage: true });
    console.log("📸 Mock 세션 스크린샷 저장: debug-mock-session.png");

    console.log("🎉 Mock 세션 테스트 완료");
  });
});
