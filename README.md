## next/dynamic

\*\* 동적 컴포넌트 로딩을 할 수 있게 해주는 역할 -> 컴포넌트를 나중에 비동기적으로 불러와서 성능 최적화 -> 초기 번들 사이즈를 줄이기 위해 -> 인증 상태에 따라 조건적으로 보여줘야 하는 ui에 자주 사용

## nextauth

\*\* 넥스트 앱을 위한 완전한 인증 솔류션 -> OAuth, 이메일, 자체, JWT세선, 데이터베이스 세션, 서버리스 친화적(API 라우트 기반으로 동작)
/auth/[...nextauth]/route.ts -> 인증 라우트 엔드포인트로 동작

\*\* 세션 저장방식 -> 서버저장없이 쿠키에 정보 포함 JWT 기반 세션
, DB 연결시 데이터베이스 세션 방식도 가능

## useSession

\*\* 클라이언트 컴포넌트에서 로그인 상태를 확인하는 훅

## difference between .ts and .tsx

\*\* JSX 문법의 사용 여부에 있음

## Skeleton UI

## debounced

\*\* 사용자가 검색창에 입력할때마다 바로 API호출하면, 너무 많은 요청 생겨 서버 부담/ 지연해서 실제 검색어 API 요청 반영

## React-Query

# my new song dashboard

[Live Demo](https://secondchap.vercel.app/)

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
  youtube
