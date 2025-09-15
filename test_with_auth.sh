#!/bin/bash

echo "=== 인증이 필요한 API 테스트 ==="
echo

# 1. 먼저 로그인 페이지에 접근해서 세션 쿠키를 얻어보기
echo "1. 로그인 페이지 접근:"
curl -c cookies.txt -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/api/auth/signin
echo

# 2. 쿠키를 사용해서 즐겨찾기 API 테스트
echo "2. 쿠키를 사용한 즐겨찾기 API 테스트:"
curl -b cookies.txt -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/api/favorites
echo

# 3. NextAuth 세션 확인
echo "3. NextAuth 세션 확인:"
curl -b cookies.txt -s http://localhost:3000/api/auth/session | python3 -m json.tool 2>/dev/null || echo "세션 없음"
echo

# 4. 쿠키 파일 정리
rm -f cookies.txt

