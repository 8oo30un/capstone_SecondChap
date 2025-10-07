#!/bin/bash

# PNG 아이콘 생성 스크립트
cd /Users/woo-hyun/Desktop/KimWooHyun/capstoneDev/secondchap

# 192x192 PNG 생성
magick public/icon.svg -background none -resize 192x192 public/icon-192.png

# 512x512 PNG 생성
magick public/icon.svg -background none -resize 512x512 public/icon-512.png

echo "PNG 파일 생성 완료!"
ls -la public/*.png

