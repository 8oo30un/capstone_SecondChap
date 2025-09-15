import { test, expect } from '@playwright/test';

test.describe('페이지 구조 디버그 테스트', () => {
  test('페이지 구조 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 제목 확인
    console.log('페이지 제목:', await page.title());
    
    // 모든 텍스트 내용 확인
    const allText = await page.locator('body').textContent();
    console.log('페이지 텍스트:', allText?.substring(0, 500));
    
    // 모든 버튼 확인
    const buttons = await page.locator('button').all();
    console.log('버튼 개수:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`버튼 ${i + 1}:`, buttonText);
    }
    
    // 모든 입력 필드 확인
    const inputs = await page.locator('input').all();
    console.log('입력 필드 개수:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`입력 필드 ${i + 1} placeholder:`, placeholder);
    }
    
    // 모든 h1, h2, h3 태그 확인
    const headings = await page.locator('h1, h2, h3').all();
    console.log('제목 태그 개수:', headings.length);
    
    for (let i = 0; i < headings.length; i++) {
      const headingText = await headings[i].textContent();
      console.log(`제목 ${i + 1}:`, headingText);
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    // 기본적인 요소들이 존재하는지 확인
    await expect(page.locator('body')).toBeVisible();
  });
});

