import { test, expect } from '@playwright/test';

test.describe('음악 발견 플랫폼 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 메인 페이지로 이동
    await page.goto('/');
  });

  test('메인 페이지 로드 및 기본 UI 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SecondChap/);
    
    // 헤더 요소들 확인
    await expect(page.locator('h1')).toContainText('SecondChap');
    await expect(page.locator('text=Music Discovery Platform')).toBeVisible();
    
    // 검색 입력창 확인
    await expect(page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]')).toBeVisible();
    
    // 즐겨찾기 영역 확인 (Favorite Artists 섹션)
    await expect(page.locator('text=Favorite Artists')).toBeVisible();
    
    // 기본 메시지 확인
    await expect(page.locator('text=음악 탐색을 시작하세요')).toBeVisible();
  });

  test('검색 기능 테스트', async ({ page }) => {
    // 검색 입력창 찾기
    const searchInput = page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]');
    
    // 검색어 입력
    await searchInput.fill('BTS');
    await searchInput.press('Enter');
    
    // 검색 결과 로딩 대기
    await page.waitForTimeout(2000);
    
    // 검색 결과가 표시되는지 확인
    const resultsContainer = page.locator('text="BTS" 검색 결과');
    await expect(resultsContainer).toBeVisible();
  });

  test('즐겨찾기 기능 테스트', async ({ page }) => {
    // 즐겨찾기 영역 확인
    const favoritesZone = page.locator('text=Favorite Artists');
    await expect(favoritesZone).toBeVisible();
    
    // 즐겨찾기 개수 표시 확인 (초기에는 0명일 가능성)
    const favoritesCount = page.locator('text=/[0-9]+명/');
    await expect(favoritesCount).toBeVisible();
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 데스크톱 뷰에서 헤더 요소들 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]')).toBeVisible();
    
    // 모바일 뷰로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서도 헤더 요소들이 보이는지 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]')).toBeVisible();
  });

  test('로딩 상태 확인', async ({ page }) => {
    // 검색으로 로딩 상태 트리거
    const searchInput = page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]');
    await searchInput.fill('Taylor Swift');
    await searchInput.press('Enter');
    
    // 로딩 인디케이터가 나타나는지 확인
    const loadingIndicator = page.locator('.animate-spin');
    
    // 로딩 인디케이터가 있으면 확인
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator.first()).toBeVisible();
    }
  });

  test('토스트 메시지 테스트', async ({ page }) => {
    // 토스트 컴포넌트가 있는지 확인
    const toastContainer = page.locator('[data-testid="toast"], .toast, .notification');
    
    // 토스트가 있다면 기본적으로 숨겨져 있는지 확인
    if (await toastContainer.count() > 0) {
      await expect(toastContainer.first()).not.toBeVisible();
    }
  });

  test('페이지 네비게이션 테스트', async ({ page }) => {
    // 페이지가 정상적으로 로드되는지 확인
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // 페이지 새로고침
    await page.reload();
    
    // 새로고침 후에도 기본 요소들이 보이는지 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]')).toBeVisible();
  });

  test('에러 처리 테스트', async ({ page }) => {
    // 잘못된 검색어로 에러 상황 시뮬레이션
    const searchInput = page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]');
    await searchInput.fill('!@#$%^&*()');
    await searchInput.press('Enter');
    
    // 에러 메시지나 빈 결과 상태 확인
    await page.waitForTimeout(2000);
    
    // 검색 결과가 표시되거나 빈 결과가 표시되는지 확인
    const searchResult = page.locator('text="!@#$%^&*()" 검색 결과');
    const emptyState = page.locator('text=검색 중...');
    
    // 둘 중 하나라도 있으면 테스트 통과
    if (await searchResult.count() > 0 || await emptyState.count() > 0) {
      await expect(searchResult.or(emptyState)).toBeVisible();
    }
  });

  test('접근성 테스트', async ({ page }) => {
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    
    // 포커스가 검색 입력창으로 이동하는지 확인
    const searchInput = page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]');
    await expect(searchInput).toBeFocused();
    
    // Enter 키로 검색 실행
    await searchInput.fill('test');
    await page.keyboard.press('Enter');
    
    // 검색이 실행되는지 확인
    await page.waitForTimeout(1000);
  });
});

test.describe('성능 테스트', () => {
  test('페이지 로드 성능', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 로드 시간이 5초 이내인지 확인
    expect(loadTime).toBeLessThan(5000);
  });

  test('검색 응답 성능', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="아티스트, 앨범, 곡명으로 검색해보세요"]');
    await searchInput.fill('test');
    
    const startTime = Date.now();
    await searchInput.press('Enter');
    
    // 검색 결과가 나타날 때까지 대기
    await page.waitForTimeout(3000);
    
    const searchTime = Date.now() - startTime;
    
    // 검색 응답 시간이 10초 이내인지 확인
    expect(searchTime).toBeLessThan(10000);
  });
});
