## next/dynamic

\*\* 동적 컴포넌트 로딩을 할 수 있게 해주는 역할 -> 컴포넌트를 나중에 비동기적으로 불러와서 성능 최적화 -> 초기 번들 사이즈를 줄이기 위해 -> 인증 상태에 따라 조건적으로 보여줘야 하는 ui에 자주 사용

## nextauth

\*\* 넥스트 앱을 위한 완전한 인증 솔류션 -> OAuth, 이메일, 자체, JWT세선, 데이터베이스 세션, 서버리스 친화적(API 라우트 기반으로 동작)
/auth/[...nextauth]/route.ts -> 인증 라우트 엔드포인트로 동작

\*\* 세션 저장방식 -> 서버저장없이 쿠키에 정보 포함 JWT 기반 세션
, DB 연결시 데이터베이스 세션 방식도 가능

## useSession

\*\* 클라이언트 컴포넌트에서 로그인 상태를 확인하는 훅

## useCallback

## difference between .ts and .tsx

\*\* JSX 문법의 사용 여부에 있음

## Skeleton UI

## debounced

\*\* 사용자가 검색창에 입력할때마다 바로 API호출하면, 너무 많은 요청 생겨 서버 부담/ 지연해서 실제 검색어 API 요청 반영

## React-Query

# 🎵 SecondChap - AI-Powered Music Discovery Platform

[Live Demo](https://secondchap.vercel.app/)

## 🚀 기술 스택 (Tech Stack)

### Frontend

- **Next.js 14** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성을 위한 정적 타입 언어
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **React Hooks** - 상태 관리 및 사이드 이펙트 처리

### Backend & API

- **Next.js API Routes** - 서버리스 API 엔드포인트
- **Spotify Web API** - 음악 데이터 및 아티스트 정보
- **Prisma** - 데이터베이스 ORM
- **SQLite** - 개발용 데이터베이스

### Authentication & Database

- **NextAuth.js** - OAuth 인증 시스템 (Google 로그인)
- **JWT** - JSON Web Token 기반 세션 관리
- **Prisma Schema** - 데이터베이스 스키마 관리

### Deployment & Infrastructure

- **Vercel** - 서버리스 배포 플랫폼
- **GitHub** - 버전 관리 및 협업
- **Environment Variables** - 보안을 위한 환경 변수 관리

## 🎯 핵심 기능 (Core Features)

### 1. 🎤 아티스트 검색 및 관리

- **실시간 검색**: Debounced 검색으로 API 호출 최적화
- **아티스트 정보**: Spotify API를 통한 상세 아티스트 정보
- **즐겨찾기**: 드래그 앤 드롭으로 아티스트 즐겨찾기 관리

### 2. 🎵 앨범 및 트랙 정보

- **앨범 상세**: 아티스트별 최신 앨범 정보 표시
- **트랙 목록**: 앨범의 모든 트랙 정보 및 재생 시간
- **Spotify 연동**: 직접 Spotify에서 재생 가능한 링크

### 3. 🔐 사용자 인증 시스템

- **Google OAuth**: 안전한 소셜 로그인
- **세션 관리**: JWT 기반 사용자 세션 유지
- **개인화**: 사용자별 즐겨찾기 아티스트 관리

### 4. 🎨 현대적인 UI/UX

- **사이버펑크 테마**: 미래지향적인 디자인
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **스켈레톤 UI**: 로딩 중 사용자 경험 향상
- **커스텀 스크롤바**: 디자인과 조화로운 스크롤 인터페이스

### 5. ⚡ 성능 최적화

- **동적 임포트**: Next.js dynamic import로 번들 크기 최적화
- **이미지 최적화**: Next.js Image 컴포넌트로 이미지 성능 향상
- **API 최적화**: Rate limiting 및 배치 처리로 Spotify API 효율적 사용

## 📱 웹 기능 구현 현황

### ✅ 구현 완료된 기능

- [x] **반응형 웹 디자인** - Tailwind CSS로 모든 화면 크기 지원
- [x] **실시간 검색** - Debounced 검색으로 사용자 입력 최적화
- [x] **OAuth 인증** - Google 로그인 및 세션 관리
- [x] **API 통합** - Spotify Web API 연동
- [x] **상태 관리** - React Hooks를 통한 효율적인 상태 관리
- [x] **로딩 상태** - Skeleton UI 및 진행률 표시
- [x] **에러 핸들링** - 사용자 친화적인 에러 메시지
- [x] **드래그 앤 드롭** - 즐겨찾기 관리
- [x] **커스텀 스크롤바** - 디자인과 조화로운 스크롤 인터페이스
- [x] **PWA 지원** - 웹 앱으로 설치 가능
- [x] **SEO 최적화** - 메타 태그 및 구조화된 데이터

### 🔄 구현 중인 기능

- [ ] **고급 필터링** - 장르, 국가별 음악 분류
- [ ] **추천 시스템** - AI 기반 음악 추천
- [ ] **플레이리스트 관리** - 사용자별 플레이리스트 생성

### 📋 향후 구현 예정 기능

- [ ] **실시간 알림** - 좋아하는 아티스트 신곡 알림
- [ ] **소셜 기능** - 친구와 음악 취향 공유
- [ ] **오프라인 지원** - Service Worker를 통한 오프라인 기능

## 🌟 프로젝트 특징

### 1. **현대적인 웹 개발 패턴**

- Next.js 14 App Router 사용
- TypeScript로 타입 안전성 확보
- 컴포넌트 기반 아키텍처

### 2. **사용자 경험 중심**

- 직관적인 인터페이스
- 빠른 로딩 속도
- 접근성 고려

### 3. **확장 가능한 구조**

- 모듈화된 컴포넌트
- 재사용 가능한 API 엔드포인트
- 환경 변수를 통한 설정 관리

## introduction

if you want to find new song, you can see your favorite artist's album easily and comfortabily. So I consider some functions about such needs.

1. artist keyword -
   It shows artist who release new songs .clicking this button, we provide the information about artist's new album.
2. categorized new-released music
   Information can be categorized by genre, searching and country if user want
   resources - debounced search
3. fetching data by spotify API
   you can use most of data by spotify API. it provides releated image and information of Album what you pick.
   resources - spotify api
4. Login
   If you want to this site, you must sign in by your google email. Not only you can enroll your favorite artists, but also see their new-released album.
   resources - nextAuth, useSession
5. Skeleton UI
   Because of fetching lots of data, you can see empty blocks somtimes.
   So I consider Conditional Rendering such as Skeleton UI, dynamic import and responsive design.

## current progress

done: Login, route API, SEO-friendly

to do: Design, favorite function, filtering

## 환경 변수 설정

이 프로젝트를 실행하려면 Spotify API 환경 변수를 설정해야 합니다.

### 로컬 개발 환경

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 다음 환경 변수 추가:

```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### Vercel 배포 환경

1. Vercel 대시보드에서 프로젝트 선택
2. Settings > Environment Variables로 이동
3. 다음 환경 변수 추가:
   - `SPOTIFY_CLIENT_ID`: Spotify Developer Dashboard의 Client ID
   - `SPOTIFY_CLIENT_SECRET`: Spotify Developer Dashboard의 Client Secret

### Spotify Developer Dashboard 설정

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 접속
2. 새 앱 생성 또는 기존 앱 선택
3. Client ID와 Client Secret 복사
4. Redirect URIs에 `http://localhost:3000/api/auth/callback/spotify` 추가 (로컬 개발용)

## question:

    1. What additional features could I implement to make this project more challenging and improve my skills?
    - component libarary, implementubg drag and ddrop ordering to your favirutes  , try to figuure out goood patttern for using ssr.


    Things you can do to make this project more difficult.

1. Try using component libraries if you haven't already.
2. Try adding Drag and Drop ordering to your favorites pages.
3. Try figure a good pattern for using server side rendered pages - maybe just the main page on first load.

   2. Are there any security aspects you would recommend me to study more deeply?

   - RBAC: Role based access control (Artist vs Listener users)
     Secrets Manager

https://aws.amazon.com/secrets-manager/

    3. What testing strategies would you recommend for this kind of project to ensure code quality and reliability?

- testing,

1. unit testing - compoenents make sure contunue to work
2. end testing - flowes throught that act

Unit testing: tests your components
End to end (or integration) testing: tests your flows through the app

Playwright for end to end: https://playwright.dev/

    Start with unit tests. Then try out end to end tests

    4. Are there any popular libraries or tools you’d recommend for enhanced security or UX?

ux - i use mantine - compoenet library
https://mantine.dev/
https://dndkit.com/

    5. How have you approached learning frontend development? Are there any experiences or resources you would recommend?

- gettingn good reading documentation
  ai for test

## 즐겨찾기 섹션에 Drap and Drop 기능을 구현.

## ServerSideRendering을 이용한 페이지 및 컴포넌트 구현.

## 컴포넌트 라이브러리를 써보기

## RBAC(Role based access control) 를 이용해 보안적인 사이트 구축
