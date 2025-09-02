# E2E 테스트 가이드

## 로그인 테스트 실행 방법

### 1. 환경 설정

테스트를 실행하기 전에 다음 환경변수를 설정해주세요:

```bash
# .env.local 파일에 추가
TEST_PASSWORD=your_actual_password_here
```

### 2. 테스트 실행 명령어

#### 기본 로그인 테스트 (헤드리스 모드)

```bash
npm run test:login
```

#### UI 모드로 테스트 실행 (브라우저에서 확인 가능)

```bash
npm run test:login-ui
```

#### 디버그 모드로 테스트 실행 (단계별 확인)

```bash
npm run test:login-debug
```

### 3. 테스트 시나리오

#### 주요 테스트 케이스:

1. **랜딩 페이지 로드 확인**

   - 페이지 제목이 "SecondChap"인지 확인
   - 헤더 요소들이 정상적으로 표시되는지 확인

2. **로그인 플로우**

   - 로그인 버튼 클릭
   - Google 로그인 버튼 클릭
   - 이메일 입력 (kwh77974481@gmail.com)
   - 비밀번호 입력
   - 로그인 상태 확인

3. **대시보드 접근 확인**

   - 로그인 후 대시보드 페이지로 리다이렉트 확인
   - 검색 기능 정상 작동 확인
   - 즐겨찾기 기능 정상 작동 확인

4. **세션 유지 테스트**
   - 페이지 새로고침 후 로그인 상태 유지 확인

### 4. 테스트 파일 구조

```
tests/
├── helpers/
│   └── auth-helpers.ts          # 로그인 관련 헬퍼 함수들
├── simple-login.spec.ts         # 간단한 로그인 테스트
├── login-e2e.spec.ts           # 상세한 로그인 E2E 테스트
└── README.md                   # 이 파일
```

### 5. 헬퍼 함수 사용법

`AuthHelpers` 클래스를 사용하여 로그인 관련 작업을 쉽게 수행할 수 있습니다:

```typescript
import { AuthHelpers } from "./helpers/auth-helpers";

test("로그인 테스트", async ({ page }) => {
  const auth = new AuthHelpers(page);

  // 전체 로그인 플로우 실행
  await auth.performLogin("kwh77974481@gmail.com", "password");

  // 또는 단계별 실행
  await auth.clickLoginButton();
  await auth.clickGoogleLoginButton();
  await auth.fillGoogleEmail("kwh77974481@gmail.com");
  await auth.fillPassword("password");
  await auth.verifyLoginStatus("kwh77974481@gmail.com");
});
```

### 6. 문제 해결

#### 테스트가 실패하는 경우:

1. **로그인 버튼을 찾을 수 없는 경우**

   - 페이지의 HTML 구조가 변경되었을 수 있습니다
   - `auth-helpers.ts`의 선택자를 업데이트해주세요

2. **Google 로그인 페이지에서 멈추는 경우**

   - 실제 Google 계정 정보가 필요합니다
   - 2단계 인증이 활성화된 경우 앱 비밀번호를 사용하세요

3. **타임아웃 오류가 발생하는 경우**
   - `playwright.config.ts`에서 타임아웃 값을 늘려주세요
   - 네트워크 연결 상태를 확인해주세요

### 7. 테스트 결과 확인

테스트 실행 후 다음 위치에서 결과를 확인할 수 있습니다:

- **HTML 리포트**: `playwright-report/index.html`
- **스크린샷**: `test-results/` 폴더
- **비디오**: `test-results/` 폴더 (실패한 테스트만)

### 8. 추가 테스트 작성

새로운 테스트를 작성할 때는 다음 패턴을 따르세요:

```typescript
import { test, expect } from "@playwright/test";
import { AuthHelpers } from "./helpers/auth-helpers";

test.describe("새로운 테스트 그룹", () => {
  test("새로운 테스트 케이스", async ({ page }) => {
    const auth = new AuthHelpers(page);

    // 테스트 로직 작성
    await page.goto("/");
    await auth.performLogin("kwh77974481@gmail.com", "password");

    // 검증 로직 작성
    await expect(page.locator("selector")).toBeVisible();
  });
});
```
