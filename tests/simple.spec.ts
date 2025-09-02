import { test, expect } from '@playwright/test';

test.describe('기본 페이지 테스트', () => {
  test('페이지가 로드되는지 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SecondChap/);
    
    // 기본 요소들이 보이는지 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('SecondChap');
  });

  test('검색 입력창이 있는지 확인', async ({ page }) => {
    await page.goto('/');
    
    // 검색 입력창 찾기
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    
    // placeholder 텍스트 확인
    await expect(searchInput).toHaveAttribute('placeholder', /아티스트/);
  });

  test('즐겨찾기 섹션이 있는지 확인', async ({ page }) => {
    await page.goto('/');
    
    // Favorite Artists 텍스트 찾기
    await expect(page.locator('text=Favorite Artists')).toBeVisible();
  });
});
