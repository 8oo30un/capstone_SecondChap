#!/bin/bash

echo "=== 프로젝트 API 테스트 ==="
echo

# API 엔드포인트 목록
apis=(
    "http://localhost:3000/api/spotify/token"
    "http://localhost:3000/api/favorites"
    "http://localhost:3000/api/spotify/search-or-new-releases?q=test&type=artist"
)

for api in "${apis[@]}"; do
    echo "Testing: $api"
    response=$(curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s" "$api")
    echo "$response"
    echo "---"
done

echo "=== 상세 테스트 ==="
echo

# Spotify 토큰 API 상세 테스트
echo "1. Spotify 토큰 API 상세 응답:"
curl -s http://localhost:3000/api/spotify/token | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"
echo

# 즐겨찾기 API 에러 응답 확인
echo "2. 즐겨찾기 API 에러 응답:"
curl -s http://localhost:3000/api/favorites | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"
echo

