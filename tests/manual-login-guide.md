# 실제 Google 로그인 테스트 가이드

## 🎯 Donobu vs 기존 도구들

### Google OAuth 로그인 테스팅의 한계

- **모든 자동화 도구** (Playwright, Selenium, Cypress, Donobu 등)는 Google에서 봇으로 인식
- Google의 보안 정책상 **자동화된 로그인은 의도적으로 차단**됨
- 이는 **보안상 정상적인 동작**이며, 실제 사용자 환경에서는 문제없음

## 🛠️ 실제 로그인 테스트 방법들

### 1. 수동 테스트 (가장 확실한 방법)

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 1. 로그인 버튼 클릭
# 2. Google 계정으로 로그인
# 3. 대시보드 접근 확인
```

### 2. 테스트용 Google 계정 사용

```bash
# 테스트 전용 Google 계정 생성
# 2단계 인증 비활성화
# 앱 비밀번호 사용 (필요시)
```

### 3. Google OAuth 테스트 환경 설정

```bash
# Google Cloud Console에서:
# 1. 테스트 사용자 추가
# 2. OAuth 동의 화면 설정
# 3. 개발자 모드 활성화
```

### 4. Mock 테스트 (현재 구현됨) ✅

```bash
npm run test:mock  # 로그인 상태 시뮬레이션
npm run test:mock-ui  # UI 모드로 확인
```

## 🔧 Donobu 사용 시 고려사항

### 장점 (예상)

- 사용자 친화적인 인터페이스
- 실시간 협업 기능
- 버그 리포팅 통합

### 한계 (예상)

- Google OAuth 자동화는 여전히 제한됨
- 다른 자동화 도구와 동일한 보안 정책 적용
- 실제 로그인 플로우는 수동 테스트 필요

## 📋 권장 테스트 전략

### 1. 자동화 테스트 (Mock)

```bash
# 기능 테스트
npm run test:mock

# UI/UX 테스트
npm run test:mock-ui

# 성능 테스트
npm run test:auth-debug
```

### 2. 수동 테스트 (실제 로그인)

- 정기적인 수동 테스트 (주 1회)
- 새로운 기능 배포 시
- Google OAuth 설정 변경 시

### 3. 통합 테스트

- CI/CD 파이프라인에서 Mock 테스트 실행
- 수동 테스트는 별도 프로세스로 관리

## 🎯 결론

**Donobu 사용 여부와 관계없이:**

- Google OAuth 자동화는 **모든 도구에서 제한됨**
- **Mock 테스트**가 가장 실용적인 해결책
- **수동 테스트**는 여전히 필요함

**현재 구현된 테스트로 충분히 커버 가능:**

- ✅ UI/UX 테스트
- ✅ 기능 테스트
- ✅ 성능 테스트
- ✅ 반응형 테스트
