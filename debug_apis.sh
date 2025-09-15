#!/bin/bash

echo "=== API 디버깅 테스트 ==="
echo

# 1. 요청/응답 헤더 확인
echo "1. Spotify 토큰 API 헤더 확인:"
curl -v http://localhost:3000/api/spotify/token 2>&1 | grep -E "(> |< )" | head -10
echo

# 2. 에러 응답 상세 확인
echo "2. 즐겨찾기 API 에러 응답 상세:"
curl -i http://localhost:3000/api/favorites
echo

# 3. POST 요청으로 데이터 전송 테스트
echo "3. POST 요청 테스트:"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"type": "album", "spotifyId": "test123", "name": "Test Album"}' \
  -i http://localhost:3000/api/favorites
echo

# 4. 잘못된 엔드포인트 테스트
echo "4. 404 에러 테스트:"
curl -i http://localhost:3000/api/nonexistent
echo

