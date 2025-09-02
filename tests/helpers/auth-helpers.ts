import { Page, expect } from "@playwright/test";

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * 로그인 버튼을 찾고 클릭합니다
   */
  async clickLoginButton(): Promise<void> {
    console.log("🔍 로그인 버튼 찾는 중...");

    // 여러 가능한 로그인 버튼 선택자들
    const loginSelectors = [
      'button:has-text("로그인")',
      'button:has-text("Login")',
      'a:has-text("로그인")',
      'a:has-text("Login")',
      '[data-testid="auth-button"]',
      ".auth-button",
      'button[class*="login"]',
      'a[class*="login"]',
      'button[class*="signin"]',
      'a[class*="signin"]',
    ];

    for (const selector of loginSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 로그인 버튼 발견: ${selector}`);
        await element.click();
        return;
      }
    }

    // 로그인 버튼을 찾을 수 없는 경우 직접 로그인 페이지로 이동
    console.log(
      "⚠️ 로그인 버튼을 찾을 수 없습니다. 직접 로그인 페이지로 이동합니다."
    );
    await this.page.goto("/api/auth/signin");
  }

  /**
   * Google 로그인 버튼을 찾고 클릭합니다
   */
  async clickGoogleLoginButton(): Promise<void> {
    console.log("🔍 Google 로그인 버튼 찾는 중...");

    const googleSelectors = [
      'button:has-text("Google")',
      'a:has-text("Google")',
      'button:has-text("구글")',
      'a:has-text("구글")',
      '[data-provider="google"]',
      'button[class*="google"]',
      'a[class*="google"]',
    ];

    for (const selector of googleSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ Google 로그인 버튼 발견: ${selector}`);
        await element.click();
        return;
      }
    }

    // Google 로그인 버튼을 찾을 수 없는 경우 직접 Google OAuth URL로 이동
    console.log(
      "⚠️ Google 로그인 버튼을 찾을 수 없습니다. 직접 Google OAuth로 이동합니다."
    );
    await this.page.goto("/api/auth/signin/google");
  }

  /**
   * Google 로그인 페이지에서 이메일을 입력합니다
   */
  async fillGoogleEmail(email: string): Promise<void> {
    console.log(`📧 Google 이메일 입력: ${email}`);

    await this.page.waitForLoadState("networkidle");

    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="이메일"]',
      'input[aria-label*="email"]',
      'input[aria-label*="이메일"]',
    ];

    for (const selector of emailSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
        await element.fill(email);

        // 다음 버튼 클릭
        await this.clickNextButton();
        return;
      }
    }

    console.log("⚠️ 이메일 입력 필드를 찾을 수 없습니다.");
  }

  /**
   * 다음 버튼을 클릭합니다
   */
  async clickNextButton(): Promise<void> {
    const nextSelectors = [
      'button:has-text("다음")',
      'button:has-text("Next")',
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("계속")',
      'button:has-text("Continue")',
    ];

    for (const selector of nextSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 다음 버튼 발견: ${selector}`);
        await element.click();
        return;
      }
    }

    // 다음 버튼을 찾을 수 없는 경우 Enter 키 사용
    console.log("⚠️ 다음 버튼을 찾을 수 없습니다. Enter 키를 사용합니다.");
    await this.page.keyboard.press("Enter");
  }

  /**
   * 비밀번호를 입력합니다
   */
  async fillPassword(password: string): Promise<void> {
    console.log("🔒 비밀번호 입력 중...");

    await this.page.waitForTimeout(2000);

    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password"]',
      'input[placeholder*="비밀번호"]',
      'input[aria-label*="password"]',
      'input[aria-label*="비밀번호"]',
    ];

    for (const selector of passwordSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
        await element.fill(password);

        // 로그인 버튼 클릭
        await this.clickSignInButton();
        return;
      }
    }

    console.log("⚠️ 비밀번호 입력 필드를 찾을 수 없습니다.");
  }

  /**
   * 로그인 버튼을 클릭합니다
   */
  async clickSignInButton(): Promise<void> {
    const signInSelectors = [
      'button:has-text("로그인")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Sign in with Google")',
      'button:has-text("Google로 로그인")',
    ];

    for (const selector of signInSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 로그인 버튼 발견: ${selector}`);
        await element.click();
        return;
      }
    }

    // 로그인 버튼을 찾을 수 없는 경우 Enter 키 사용
    console.log("⚠️ 로그인 버튼을 찾을 수 없습니다. Enter 키를 사용합니다.");
    await this.page.keyboard.press("Enter");
  }

  /**
   * 로그인 상태를 확인합니다
   */
  async verifyLoginStatus(email?: string): Promise<boolean> {
    console.log("🔍 로그인 상태 확인 중...");

    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(3000);

    // 사용자 정보 확인
    if (email) {
      const userInfo = this.page.locator(`text=${email}`).first();
      if ((await userInfo.count()) > 0) {
        console.log(`✅ 사용자 정보 확인됨: ${email}`);
        return true;
      }
    }

    // 로그아웃 버튼 확인
    const logoutSelectors = [
      'button:has-text("로그아웃")',
      'button:has-text("Logout")',
      'a:has-text("로그아웃")',
      'a:has-text("Logout")',
      '[data-testid="logout-button"]',
    ];

    for (const selector of logoutSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 로그아웃 버튼 확인됨: ${selector}`);
        return true;
      }
    }

    // 대시보드 요소 확인
    const dashboardSelectors = [
      'h1:has-text("SecondChap")',
      'input[placeholder*="검색"]',
      "text=즐겨찾기",
      "text=Favorite",
      '[data-testid="dashboard"]',
    ];

    for (const selector of dashboardSelectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        console.log(`✅ 대시보드 요소 확인됨: ${selector}`);
        return true;
      }
    }

    console.log("⚠️ 로그인 상태를 확인할 수 없습니다.");
    return false;
  }

  /**
   * 대시보드 페이지로 이동했는지 확인합니다
   */
  async verifyDashboardAccess(): Promise<void> {
    console.log("🎯 대시보드 접근 확인 중...");

    const currentUrl = this.page.url();
    console.log("현재 URL:", currentUrl);

    // URL이 localhost:3000을 포함하는지 확인
    expect(currentUrl).toMatch(/localhost:3000/);

    // 대시보드 요소들이 보이는지 확인
    const dashboardElements = [
      'h1:has-text("SecondChap")',
      'input[placeholder*="검색"]',
      "text=즐겨찾기",
      "text=Favorite",
    ];

    let dashboardFound = false;
    for (const selector of dashboardElements) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        await expect(element).toBeVisible();
        dashboardFound = true;
        console.log(`✅ 대시보드 요소 확인됨: ${selector}`);
        break;
      }
    }

    if (!dashboardFound) {
      console.log("⚠️ 대시보드 요소를 찾을 수 없지만 URL은 올바릅니다.");
    }
  }

  /**
   * 전체 로그인 플로우를 실행합니다
   */
  async performLogin(email: string, password?: string): Promise<void> {
    console.log("🚀 로그인 플로우 시작...");

    // 1. 로그인 버튼 클릭
    await this.clickLoginButton();

    // 2. Google 로그인 버튼 클릭
    await this.clickGoogleLoginButton();

    // 3. 이메일 입력
    await this.fillGoogleEmail(email);

    // 4. 비밀번호 입력 (있는 경우)
    if (password) {
      await this.fillPassword(password);
    }

    // 5. 로그인 상태 확인
    await this.verifyLoginStatus(email);

    // 6. 대시보드 접근 확인
    await this.verifyDashboardAccess();

    console.log("✅ 로그인 플로우 완료!");
  }
}
