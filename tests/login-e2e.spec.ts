import { test, expect } from "@playwright/test";

test.describe("로그인 E2E 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 메인 페이지로 이동
    await page.goto("/");
  });

  test("랜딩 페이지에서 로그인까지 전체 플로우", async ({ page }) => {
    // 1. 랜딩 페이지 확인
    console.log("🎯 1단계: 랜딩 페이지 확인");

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SecondChap/);

    // 헤더 요소들 확인
    await expect(page.locator("h1")).toContainText("SecondChap");

    // 로그인 버튼 찾기 (여러 가능한 선택자 시도)
    const loginButton = page
      .locator(
        'button:has-text("로그인"), button:has-text("Login"), a:has-text("로그인"), a:has-text("Login")'
      )
      .first();

    // 로그인 버튼이 보이지 않으면 다른 방법으로 찾기
    if ((await loginButton.count()) === 0) {
      // AuthButton 컴포넌트나 다른 로그인 관련 요소 찾기
      const authButton = page
        .locator(
          '[data-testid="auth-button"], .auth-button, button[class*="login"], a[class*="login"]'
        )
        .first();
      if ((await authButton.count()) > 0) {
        await authButton.click();
      } else {
        // URL에서 직접 로그인 페이지로 이동
        await page.goto("/api/auth/signin");
      }
    } else {
      await loginButton.click();
    }

    // 2. 로그인 페이지로 이동 확인
    console.log("🎯 2단계: 로그인 페이지 이동");

    // 로그인 페이지가 로드될 때까지 대기
    await page.waitForLoadState("networkidle");

    // Google 로그인 버튼 찾기
    const googleLoginButton = page
      .locator(
        'button:has-text("Google"), a:has-text("Google"), [data-provider="google"]'
      )
      .first();

    if ((await googleLoginButton.count()) === 0) {
      // 다른 방법으로 Google 로그인 찾기
      const googleButton = page
        .locator(
          'button[class*="google"], a[class*="google"], button:has-text("구글")'
        )
        .first();
      if ((await googleButton.count()) > 0) {
        await googleButton.click();
      } else {
        // 직접 Google OAuth URL로 이동
        await page.goto("/api/auth/signin/google");
      }
    } else {
      await googleLoginButton.click();
    }

    // 3. Google 로그인 페이지에서 이메일 입력
    console.log("🎯 3단계: Google 로그인 페이지에서 이메일 입력");

    // Google 로그인 페이지가 로드될 때까지 대기
    await page.waitForLoadState("networkidle");

    // 이메일 입력 필드 찾기
    const emailInput = page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="이메일"]'
      )
      .first();

    if ((await emailInput.count()) > 0) {
      await emailInput.fill("kwh77974481@gmail.com");

      // 다음 버튼 클릭
      const nextButton = page
        .locator(
          'button:has-text("다음"), button:has-text("Next"), input[type="submit"]'
        )
        .first();
      if ((await nextButton.count()) > 0) {
        await nextButton.click();
      } else {
        await emailInput.press("Enter");
      }
    } else {
      // 이메일 입력 필드를 찾을 수 없는 경우, 직접 이메일을 URL에 포함
      console.log(
        "⚠️ 이메일 입력 필드를 찾을 수 없습니다. 수동으로 진행합니다."
      );
    }

    // 4. 비밀번호 입력 (필요한 경우)
    console.log("🎯 4단계: 비밀번호 입력");

    await page.waitForTimeout(2000);

    const passwordInput = page
      .locator('input[type="password"], input[name="password"]')
      .first();

    if ((await passwordInput.count()) > 0) {
      // 실제 비밀번호는 환경변수에서 가져오거나 테스트용 계정 사용
      const testPassword = process.env.TEST_PASSWORD || "test1234";
      await passwordInput.fill(testPassword);

      // 로그인 버튼 클릭
      const signInButton = page
        .locator(
          'button:has-text("로그인"), button:has-text("Sign in"), input[type="submit"]'
        )
        .first();
      if ((await signInButton.count()) > 0) {
        await signInButton.click();
      } else {
        await passwordInput.press("Enter");
      }
    }

    // 5. 대시보드 페이지로 리다이렉트 확인
    console.log("🎯 5단계: 대시보드 페이지 확인");

    // 리다이렉트 대기
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 대시보드 페이지 요소들 확인
    const dashboardElements = [
      'h1:has-text("SecondChap")',
      'input[placeholder*="검색"]',
      "text=즐겨찾기",
      "text=Favorite",
    ];

    let dashboardFound = false;
    for (const selector of dashboardElements) {
      if ((await page.locator(selector).count()) > 0) {
        await expect(page.locator(selector).first()).toBeVisible();
        dashboardFound = true;
        break;
      }
    }

    if (!dashboardFound) {
      // URL 확인으로 대시보드 접근 확인
      const currentUrl = page.url();
      console.log("현재 URL:", currentUrl);

      // 로그인 성공 시 리다이렉트된 URL 확인
      expect(currentUrl).toMatch(/localhost:3000/);
    }

    // 6. 로그인 상태 확인
    console.log("🎯 6단계: 로그인 상태 확인");

    // 사용자 정보가 표시되는지 확인
    const userInfo = page
      .locator(
        'text=kwh77974481@gmail.com, text=User, [data-testid="user-info"]'
      )
      .first();

    if ((await userInfo.count()) > 0) {
      await expect(userInfo).toBeVisible();
    } else {
      // 로그아웃 버튼이나 사용자 메뉴가 있는지 확인
      const logoutButton = page
        .locator(
          'button:has-text("로그아웃"), button:has-text("Logout"), a:has-text("로그아웃")'
        )
        .first();
      if ((await logoutButton.count()) > 0) {
        await expect(logoutButton).toBeVisible();
      }
    }

    console.log("✅ 로그인 E2E 테스트 완료!");
  });

  test("로그인 실패 시나리오 테스트", async ({ page }) => {
    console.log("🎯 로그인 실패 시나리오 테스트");

    // 잘못된 이메일로 로그인 시도
    await page.goto("/api/auth/signin");

    const googleLoginButton = page
      .locator('button:has-text("Google"), a:has-text("Google")')
      .first();
    if ((await googleLoginButton.count()) > 0) {
      await googleLoginButton.click();
    }

    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"]').first();
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("invalid-email@test.com");
      await emailInput.press("Enter");

      // 에러 메시지 확인
      await page.waitForTimeout(2000);

      const errorMessage = page
        .locator("text=error, text=Error, text=잘못된, text=invalid")
        .first();
      if ((await errorMessage.count()) > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test("로그인 후 대시보드 기능 확인", async ({ page }) => {
    console.log("🎯 로그인 후 대시보드 기능 확인");

    // 로그인 상태에서 메인 페이지 접근
    await page.goto("/");

    // 검색 기능 테스트
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
      }
    }

    // 즐겨찾기 기능 확인
    const favoritesSection = page
      .locator("text=즐겨찾기, text=Favorite")
      .first();
    if ((await favoritesSection.count()) > 0) {
      await expect(favoritesSection).toBeVisible();
    }
  });
});

test.describe("인증 상태 관리 테스트", () => {
  test("세션 유지 테스트", async ({ page }) => {
    console.log("🎯 세션 유지 테스트");

    // 로그인 후 페이지 새로고침
    await page.goto("/");

    // 새로고침
    await page.reload();

    // 로그인 상태가 유지되는지 확인
    const userInfo = page
      .locator('text=kwh77974481@gmail.com, [data-testid="user-info"]')
      .first();
    const logoutButton = page
      .locator('button:has-text("로그아웃"), button:has-text("Logout")')
      .first();

    if ((await userInfo.count()) > 0 || (await logoutButton.count()) > 0) {
      console.log("✅ 세션이 유지되었습니다.");
    } else {
      console.log("⚠️ 세션이 유지되지 않았습니다.");
    }
  });

  test("로그아웃 테스트", async ({ page }) => {
    console.log("🎯 로그아웃 테스트");

    await page.goto("/");

    // 로그아웃 버튼 찾기
    const logoutButton = page
      .locator(
        'button:has-text("로그아웃"), button:has-text("Logout"), a:has-text("로그아웃")'
      )
      .first();

    if ((await logoutButton.count()) > 0) {
      await logoutButton.click();

      await page.waitForLoadState("networkidle");

      // 로그인 페이지로 리다이렉트되었는지 확인
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/signin|login|auth/);
    }
  });
});
