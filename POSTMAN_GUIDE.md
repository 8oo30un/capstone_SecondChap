# Postman을 사용한 SecondChap API 디버깅 가이드

## 📋 목차

1. [Postman 설정](#postman-설정)
2. [컬렉션 가져오기](#컬렉션-가져오기)
3. [환경 설정](#환경-설정)
4. [API 테스트 방법](#api-테스트-방법)
5. [디버깅 팁](#디버깅-팁)
6. [자동화 테스트](#자동화-테스트)

## 🚀 Postman 설정

### 1. Postman 설치

- [Postman 공식 사이트](https://www.postman.com/downloads/)에서 다운로드
- 무료 계정으로도 충분히 사용 가능

### 2. 컬렉션 가져오기

1. Postman 실행
2. `Import` 버튼 클릭
3. `postman_collection.json` 파일 선택
4. `Import` 클릭

### 3. 환경 설정

1. `Import` 버튼 클릭
2. `postman_environment.json` 파일 선택
3. 우측 상단에서 환경을 `SecondChap Development`로 선택

## 🔧 환경 설정

### 환경 변수들

- `baseUrl`: `http://localhost:3000` (개발 서버 주소)
- `accessToken`: Spotify 액세스 토큰 (자동 설정됨)
- `sessionToken`: NextAuth 세션 토큰 (수동 설정 필요)
- `testAlbumId`: 테스트용 앨범 ID
- `testArtistId`: 테스트용 아티스트 ID
- `testQuery`: 테스트용 검색 쿼리
- `testCountry`: 테스트용 국가 코드

## 🧪 API 테스트 방법

### 1. 기본 API 테스트

#### Spotify 토큰 가져오기

```
GET {{baseUrl}}/api/spotify/token
```

- **목적**: Spotify API 액세스 토큰 획득
- **응답**: `access_token`, `token_type`, `expires_in`
- **자동화**: 토큰이 환경 변수에 자동 저장됨

#### 검색 API 테스트

```
GET {{baseUrl}}/api/spotify/search-or-new-releases?q={{testQuery}}&country={{testCountry}}
```

- **파라미터**:
  - `q`: 검색 쿼리 (예: "BTS", "Ed Sheeran")
  - `country`: 국가 코드 (KR, US, JP, GB)
  - `genre`: 장르 필터 (k-pop, pop, rock 등)
  - `favoriteArtistIds`: 즐겨찾기 아티스트 ID들

### 2. 인증이 필요한 API 테스트

#### 세션 토큰 획득 방법

1. 브라우저에서 `http://localhost:3000` 접속
2. 개발자 도구 → Application → Cookies
3. `next-auth.session-token` 값 복사
4. Postman 환경 변수 `sessionToken`에 설정

#### 즐겨찾기 API 테스트

```
GET {{baseUrl}}/api/favorites
Headers: Cookie: next-auth.session-token={{sessionToken}}
```

```
POST {{baseUrl}}/api/favorites
Headers:
  - Content-Type: application/json
  - Cookie: next-auth.session-token={{sessionToken}}
Body:
{
  "type": "album",
  "spotifyId": "{{testAlbumId}}",
  "name": "Test Album",
  "image": "https://example.com/image.jpg"
}
```

## 🔍 디버깅 팁

### 1. 응답 분석

- **상태 코드**: 200 (성공), 401 (인증 필요), 404 (찾을 수 없음), 500 (서버 오류)
- **응답 시간**: API 성능 확인
- **응답 크기**: 데이터 양 확인

### 2. 에러 디버깅

```javascript
// Postman Tests 탭에서 사용할 수 있는 스크립트
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("albums");
  pm.expect(jsonData).to.have.property("artists");
});

pm.test("Response time is less than 2000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### 3. 변수 자동 설정

```javascript
// Spotify 토큰 자동 저장
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.collectionVariables.set("accessToken", response.access_token);
  console.log("Spotify token saved:", response.access_token);
}
```

### 4. 요청 전처리

```javascript
// Pre-request Script 탭에서 사용
// 현재 시간을 타임스탬프로 설정
pm.environment.set("timestamp", new Date().getTime());

// 랜덤 테스트 데이터 생성
pm.environment.set("randomId", Math.random().toString(36).substr(2, 9));
```

## 🤖 자동화 테스트

### 1. Collection Runner 사용

1. 컬렉션 우클릭 → `Run collection`
2. 테스트할 요청들 선택
3. `Run SecondChap API Collection` 클릭
4. 결과 확인

### 2. Newman (CLI) 사용

```bash
# Newman 설치
npm install -g newman

# 컬렉션 실행
newman run postman_collection.json -e postman_environment.json

# HTML 리포트 생성
newman run postman_collection.json -e postman_environment.json -r html --reporter-html-export report.html
```

### 3. CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Run API Tests
  run: |
    newman run postman_collection.json -e postman_environment.json
```

## 📊 테스트 시나리오

### 1. 기본 기능 테스트

- [ ] Spotify 토큰 획득
- [ ] 아티스트 검색
- [ ] 앨범 검색
- [ ] 국가별 필터링
- [ ] 장르별 필터링

### 2. 인증 테스트

- [ ] 로그인 없이 즐겨찾기 접근 (401 에러 확인)
- [ ] 유효한 세션으로 즐겨찾기 접근
- [ ] 즐겨찾기 추가/삭제

### 3. 에러 처리 테스트

- [ ] 잘못된 엔드포인트 (404 에러)
- [ ] 잘못된 Spotify ID (400 에러)
- [ ] 서버 오류 시뮬레이션

### 4. 성능 테스트

- [ ] 응답 시간 측정
- [ ] 대용량 데이터 처리
- [ ] 동시 요청 처리

## 🛠️ 고급 기능

### 1. Mock Server 설정

1. 컬렉션 우클릭 → `Mock collection`
2. Mock URL 생성
3. 예상 응답 설정
4. 개발 중 API 의존성 제거

### 2. API 문서화

1. 컬렉션 → `View Documentation`
2. 자동 생성된 문서 확인
3. 팀과 공유

### 3. 모니터링 설정

1. `Monitor` 탭에서 새 모니터 생성
2. 정기적인 API 상태 확인
3. 알림 설정

## 🚨 주의사항

1. **개발 서버 실행**: 테스트 전에 `npm run dev`로 서버 실행
2. **환경 변수**: `.env.local` 파일의 Spotify API 키 확인
3. **세션 토큰**: 로그인 후에만 즐겨찾기 API 테스트 가능
4. **Rate Limiting**: Spotify API 호출 제한 주의
5. **데이터 정합성**: 테스트 데이터와 실제 데이터 구분

## 📞 문제 해결

### 자주 발생하는 문제들

1. **401 Unauthorized**: 세션 토큰 확인
2. **500 Internal Server Error**: 서버 로그 확인
3. **빈 응답**: Spotify API 키 확인
4. **느린 응답**: 네트워크 상태 확인

### 로그 확인 방법

```bash
# 개발 서버 로그 확인
npm run dev

# 또는 터미널에서 직접 확인
tail -f .next/server.log
```

이 가이드를 따라하면 Postman을 사용해서 SecondChap 프로젝트의 모든 API를 체계적으로 테스트하고 디버깅할 수 있습니다!




