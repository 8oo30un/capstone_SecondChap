# Presentation Demo Guide

## 실시간 데모 가이드

---

## 🎯 Demo Flow (15분)

### **1. 프로젝트 소개 (2분)**

```bash
# 터미널에서 프로젝트 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# "이것이 SecondChap 음악 발견 플랫폼입니다"
```

### **2. API 구조 시연 (3분)**

```bash
# API 엔드포인트 확인
curl -s http://localhost:3000/api/spotify/token | head -5

# 응답 시간 측정
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/api/spotify/token
```

### **3. Postman 컬렉션 데모 (5분)**

#### **A. 컬렉션 구조 보여주기**

- Spotify APIs 폴더
- Favorites APIs 폴더
- Authentication APIs 폴더
- Test Scenarios 폴더

#### **B. 실제 테스트 실행**

```javascript
// Tests 탭에서 실행할 스크립트
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

#### **C. 환경 변수 활용**

- `{{baseUrl}}` 변수 사용
- `{{accessToken}}` 자동 설정
- `{{testQuery}}` 동적 데이터

### **4. Playwright E2E 테스트 (3분)**

```bash
# 테스트 실행
npm run test:e2e

# 특정 테스트 실행
npm run test:login
```

### **5. 성능 모니터링 (2분)**

```bash
# API 응답 시간 측정
for i in {1..5}; do
  echo "Test $i:"
  curl -w "Time: %{time_total}s, Status: %{http_code}\n" -o /dev/null -s http://localhost:3000/api/spotify/token
done
```

---

## 📊 시각적 자료 준비

### **1. 아키텍처 다이어그램**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Spotify)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Testing       │    │   Database      │    │   Auth          │
│   (Postman)     │    │   (Prisma)      │    │   (NextAuth)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **2. 테스팅 피라미드**

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Playwright
                    │   (Few, Slow)   │
                    └─────────────────┘
               ┌─────────────────────────┐
               │   Integration Tests     │ ← Postman
               │   (Some, Medium)        │
               └─────────────────────────┘
        ┌─────────────────────────────────────┐
        │   Unit Tests                        │ ← Custom Scripts
        │   (Many, Fast)                      │
        └─────────────────────────────────────┘
```

### **3. 성능 지표 차트**

```
Response Time (ms)
     │
 2000├─────────────────────────────────────────
     │
 1500├─────────────────────────────────────────
     │
 1000├─────────────────────────────────────────
     │
  500├─────────────────────────────────────────
     │
    0└─────────────────────────────────────────
      Token  Search  Album  Artist  Favorites
```

---

## 🎤 발표 스크립트 (한국어)

### **도입부**

"안녕하세요. 오늘은 SecondChap 음악 발견 플랫폼의 API 테스팅 전략에 대해 발표하겠습니다. 이 프로젝트는 Next.js와 Spotify API를 활용한 음악 추천 서비스입니다."

### **문제 정의**

"주요 도전과제는 다음과 같습니다:

1. Google OAuth를 통한 복잡한 인증 시스템
2. Spotify API의 제한사항과 의존성
3. 실시간 음악 추천 데이터 처리
4. 다양한 사용자 플로우 테스팅"

### **해결책 제시**

"이를 해결하기 위해 다중 도구 접근법을 채택했습니다:

- Postman: API 문서화 및 자동화 테스트
- Playwright: E2E 사용자 플로우 테스트
- curl: 빠른 API 검증 및 디버깅
- 커스텀 스크립트: 비즈니스 로직 검증"

### **데모 진행**

"실제로 어떻게 작동하는지 보여드리겠습니다..."

### **결과 공유**

"이 전략을 통해 다음과 같은 성과를 얻었습니다:

- API 엔드포인트 100% 커버리지
- 프로덕션 버그 60% 감소
- 개발 속도 40% 향상
- 모든 API가 2초 이내 응답"

---

## 🛠️ 기술적 데모 준비

### **1. Postman 설정 확인**

```bash
# 컬렉션 파일 확인
ls -la postman_*.json

# 환경 파일 확인
cat postman_environment.json | head -10
```

### **2. 테스트 스크립트 준비**

```javascript
// 응답 검증 스크립트
pm.test("API Response Validation", function () {
  const jsonData = pm.response.json();

  // 상태 코드 확인
  pm.expect(pm.response.code).to.equal(200);

  // 응답 시간 확인
  pm.expect(pm.response.responseTime).to.be.below(2000);

  // 데이터 구조 확인
  pm.expect(jsonData).to.have.property("albums");
  pm.expect(jsonData).to.have.property("artists");

  // 로깅
  console.log("✅ API Test Passed");
  console.log("📊 Response Time:", pm.response.responseTime + "ms");
  console.log("📈 Data Count:", jsonData.albums.length + " albums");
});
```

### **3. 에러 시나리오 준비**

```bash
# 404 에러 테스트
curl -i http://localhost:3000/api/nonexistent

# 401 에러 테스트
curl -i http://localhost:3000/api/favorites

# 잘못된 파라미터 테스트
curl -i "http://localhost:3000/api/spotify/album?id=invalid"
```

---

## 📝 Q&A 준비

### **예상 질문과 답변**

**Q: "테스트 데이터는 어떻게 관리하나요?"**
A: "동적 데이터 생성과 환경별 테스트 데이터셋을 사용합니다. 또한 데이터베이스 시딩을 통해 일관된 테스트 시나리오를 보장합니다."

**Q: "실제 Spotify 데이터로 테스트하나요?"**
A: "실제 API 호출과 모킹된 응답을 조합해서 사용합니다. Rate limiting은 테스트 스케줄링과 캐싱으로 처리합니다."

**Q: "테스트 안정성은 어떻게 보장하나요?"**
A: "Flaky test 감지와 재시도 메커니즘, 환경 격리 및 정리 절차를 통해 안정성을 확보합니다."

**Q: "CI/CD 통합은 어떻게 하나요?"**
A: "Newman을 통한 CLI 기반 테스트 실행, GitHub Actions를 통한 자동화된 테스트 실행, 테스트 결과 보고 및 알림 시스템을 구축했습니다."

---

## 🎯 발표 성공 팁

### **1. 준비사항**

- [ ] 모든 도구가 정상 작동하는지 확인
- [ ] 데모 시나리오를 미리 연습
- [ ] 백업 계획 준비 (네트워크 문제 등)
- [ ] 시각적 자료 준비 완료

### **2. 발표 중 주의사항**

- 청중의 기술 수준에 맞춰 설명
- 너무 기술적인 세부사항보다는 비즈니스 가치 강조
- 상호작용 유도 (질문, 경험 공유)
- 시간 관리 (15분 내 완료)

### **3. 후속 조치**

- 발표 자료 공유
- 추가 질문에 대한 답변 제공
- 협업 가능성 논의
- 피드백 수집 및 개선점 파악

이 가이드를 따라하면 효과적인 발표를 할 수 있습니다! 🚀



