import { test, expect } from '@playwright/test';

test.describe('SecondChap 완전 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 메인 페이지로 이동
    await page.goto('/');
  });

  test('랜딩 페이지 로드 및 시작 버튼 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SecondChap/);
    
    // 랜딩 페이지 요소들 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('SecondChap');
    
    // START DISCOVERY 버튼 확인
    const startButton = page.locator('button:has-text("START DISCOVERY")');
    await expect(startButton).toBeVisible();
    
    // START DISCOVERY 버튼 클릭
    await startButton.click();
    
    // 로그인 모달이나 다음 페이지로 이동하는지 확인
    await page.waitForTimeout(2000);
    
    // 로그인 관련 요소가 나타나는지 확인
    const hasLoginElements = await page.locator('text=로그인, text=Login, text=Sign in').count() > 0;
    const hasSpotifyElements = await page.locator('text=Spotify').count() > 0;
    
    expect(hasLoginElements || hasSpotifyElements).toBeTruthy();
  });

  test('로그인 후 대시보드 기능 테스트', async ({ page }) => {
    // 로그인 상태를 시뮬레이션하기 위해 세션 쿠키 설정
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // 페이지 새로고침
    await page.reload();
    
    // 로그인 후 대시보드 요소들 확인
    await expect(page.locator('text=Music Discovery Platform')).toBeVisible();
    
    // 검색 입력창 확인 (실제 placeholder 확인)
    const searchInput = page.locator('input[placeholder*="아티스트"], input[placeholder*="검색"], input[type="text"]');
    await expect(searchInput).toBeVisible();
    
    // 즐겨찾기 영역 확인
    await expect(page.locator('text=즐겨찾기, text=Favorite, text=Favorites')).toBeVisible();
    
    // 앨범/아티스트 섹션 확인
    await expect(page.locator('text=앨범, text=Album, text=Albums')).toBeVisible();
    await expect(page.locator('text=아티스트, text=Artist, text=Artists')).toBeVisible();
  });

  test('검색 기능 테스트', async ({ page }) => {
    // 로그인 상태 시뮬레이션
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    await page.reload();
    
    // 검색 입력창 찾기
    const searchInput = page.locator('input[placeholder*="아티스트"], input[placeholder*="검색"], input[type="text"]');
    await expect(searchInput).toBeVisible();
    
    // 검색어 입력
    await searchInput.fill('BTS');
    await searchInput.press('Enter');
    
    // 검색 결과가 로드되는지 확인 (로딩 상태 확인)
    await page.waitForTimeout(3000);
    
    // 검색 결과가 있거나 "결과가 없습니다" 메시지가 나타나는지 확인
    const hasResults = await page.locator('text=결과가 없습니다, text=No results, text=검색 결과가 없습니다').isVisible();
    const hasAlbums = await page.locator('[data-testid="album-item"], .album-item, [class*="album"]').count() > 0;
    const hasArtists = await page.locator('[data-testid="artist-item"], .artist-item, [class*="artist"]').count() > 0;
    
    expect(hasResults || hasAlbums || hasArtists).toBeTruthy();
  });

  test('즐겨찾기 기능 테스트', async ({ page }) => {
    // 로그인 상태 시뮬레이션
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    await page.reload();
    
    // 즐겨찾기 영역 확인
    await expect(page.locator('text=즐겨찾기, text=Favorite, text=Favorites')).toBeVisible();
    
    // 즐겨찾기 드롭존 확인
    const dropZone = page.locator('[data-testid="favorite-dropzone"], [class*="dropzone"], [class*="favorite"]');
    await expect(dropZone).toBeVisible();
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 로그인 상태 시뮬레이션
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    await page.reload();
    
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
    
    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('페이지 네비게이션 테스트', async ({ page }) => {
    // 로그인 상태 시뮬레이션
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    await page.reload();
    
    // 사이드바 토글 버튼 확인
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"], [class*="sidebar"], [class*="menu"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      
      // 사이드바가 열리는지 확인
      const sidebar = page.locator('[data-testid="sidebar"], [class*="sidebar"]');
      await expect(sidebar).toBeVisible();
    }
  });

  test('접근성 테스트', async ({ page }) => {
    // 로그인 상태 시뮬레이션
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    await page.reload();
    
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    
    // 포커스가 이동하는지 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // ARIA 라벨 확인
    const searchInput = page.locator('input[placeholder*="아티스트"], input[placeholder*="검색"], input[type="text"]');
    const hasAriaLabel = await searchInput.getAttribute('aria-label');
    expect(hasAriaLabel).toBeTruthy();
  });
});
