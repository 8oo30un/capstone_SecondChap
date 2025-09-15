"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface CustomMusicPlayerProps {
  albumId: string;
  albumName?: string;
  albumImage?: string;
  artistName?: string;
  className?: string;
  onClose?: () => void;
}

export default function CustomMusicPlayer({
  albumId,
  albumName = "알 수 없는 앨범",
  albumImage,
  artistName = "알 수 없는 아티스트",
  className = "",
  onClose,
}: CustomMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const [tracks, setTracks] = useState<
    Array<{
      id: string;
      name: string;
      duration: number;
      track_number: number;
      artists: Array<{ name: string; id: string }>;
      preview_url: string | null;
    }>
  >([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const [equalizerBars, setEqualizerBars] = useState<number[]>([]);

  // 시뮬레이션된 재생 시간 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // 이퀄라이저 애니메이션 (물결치는 효과)
  useEffect(() => {
    let animationId: number;
    let startTime = 0;

    if (isPlaying) {
      const animateEqualizer = (timestamp: number) => {
        if (startTime === 0) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // 물결치는 패턴을 위한 사인파 기반 계산
        setEqualizerBars((prevBars) =>
          prevBars.map((_, index) => {
            // 각 바마다 다른 주파수와 위상으로 물결 효과
            const frequency = 0.5 + index * 0.1; // 0.5Hz ~ 1.2Hz
            const phase = (index * Math.PI) / 4; // 0 ~ 2π 사이의 위상차
            const amplitude = 30 + index * 5; // 30 ~ 65의 진폭
            const baseHeight = 20 + index * 3; // 기본 높이

            // 사인파 + 코사인파로 복합적인 물결 효과
            const sineWave = Math.sin(elapsed * frequency * 0.01 + phase);
            const cosineWave = Math.cos(
              elapsed * frequency * 0.007 + phase * 0.8
            );
            const combinedWave = (sineWave + cosineWave * 0.5) * amplitude;

            return Math.max(5, baseHeight + combinedWave);
          })
        );

        animationId = requestAnimationFrame(animateEqualizer);
      };
      animateEqualizer(0);
    } else {
      setEqualizerBars(Array.from({ length: 8 }, () => 0));
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);

  // 실제 트랙 데이터 가져오기
  useEffect(() => {
    const fetchTracks = async () => {
      if (!albumId) return;

      setTracksLoading(true);
      try {
        const response = await fetch(
          `/api/spotify/album-tracks-detail?albumId=${albumId}`
        );
        const data = await response.json();

        if (data.success) {
          setTracks(data.tracks);
          setTotalTracks(data.total);
          // 첫 번째 트랙의 길이로 duration 설정
          if (data.tracks.length > 0) {
            setDuration(data.tracks[0].duration);
          }
        } else {
          console.error("트랙 데이터 로드 실패:", data.error);
          // 실패 시 기본 데이터 사용
          const mockTracks = Array.from({ length: 12 }, (_, i) => ({
            id: `mock-${i}`,
            name: `${albumName} - Track ${i + 1}`,
            duration: Math.floor(Math.random() * 180) + 120,
            track_number: i + 1,
            artists: [{ name: artistName, id: `artist-${i}` }],
            preview_url: null,
          }));
          setTracks(mockTracks);
          setTotalTracks(12);
        }
      } catch (error) {
        console.error("트랙 데이터 로드 오류:", error);
        // 에러 시 기본 데이터 사용
        const mockTracks = Array.from({ length: 12 }, (_, i) => ({
          id: `mock-${i}`,
          name: `${albumName} - Track ${i + 1}`,
          duration: Math.floor(Math.random() * 180) + 120,
          track_number: i + 1,
          artists: [{ name: artistName, id: `artist-${i}` }],
          preview_url: null,
        }));
        setTracks(mockTracks);
        setTotalTracks(12);
      } finally {
        setTracksLoading(false);
      }
    };

    fetchTracks();
  }, [albumId, albumName, artistName]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (trackNumber: number) => {
    if (trackNumber < 1 || trackNumber > totalTracks) return;

    setCurrentTrack(trackNumber);
    setCurrentTime(0);

    // 해당 트랙의 길이로 duration 업데이트
    const track = tracks.find((t) => t.track_number === trackNumber);
    if (track) {
      setDuration(track.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(
      0,
      Math.min(duration, (clickX / width) * duration)
    );

    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10 transition-all duration-300 ${
        isExpanded ? "h-96" : "h-20"
      } ${className}`}
    >
      {/* 메인 플레이어 바 */}
      <div className="flex items-center justify-between p-4 h-20">
        {/* 앨범 정보 */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12 flex-shrink-0">
            {albumImage ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={albumImage}
                  alt={albumName}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
            )}

            {/* AI 이퀄라이저 */}
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 flex items-end space-x-0.5">
                {equalizerBars.map((height, index) => (
                  <div
                    key={index}
                    className="w-0.5 bg-gradient-to-t from-green-400 via-emerald-300 to-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      height: `${Math.max(2, height * 0.3)}px`,
                      animationDelay: `${index * 150}ms`,
                      transform: `scaleY(${
                        1 + Math.sin(Date.now() * 0.002 + index) * 0.1
                      })`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">
              {tracks.find((t) => t.track_number === currentTrack)?.name ||
                albumName}
            </h3>
            <p className="text-gray-400 text-xs truncate">
              {tracks
                .find((t) => t.track_number === currentTrack)
                ?.artists.map((artist) => artist.name)
                .join(", ") || artistName}
            </p>
          </div>
        </div>

        {/* 재생 컨트롤 */}
        <div className="flex items-center gap-4">
          {/* 이전 트랙 */}
          <button
            onClick={() => changeTrack(Math.max(1, currentTrack - 1))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* 재생/일시정지 */}
          <button
            onClick={togglePlay}
            className={`p-3 rounded-full text-white transition-all duration-300 hover:scale-110 ${
              isPlaying
                ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                : "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
            }`}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* 다음 트랙 */}
          <button
            onClick={() => changeTrack(Math.min(totalTracks, currentTrack + 1))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* 확장/축소 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>

          {/* 닫기 */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 확장된 플레이어 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* AI 이퀄라이저 */}
          {isPlaying && (
            <div className="flex items-end justify-center space-x-1 h-16 bg-gray-800/50 rounded-lg p-4">
              {equalizerBars.map((height, index) => (
                <div
                  key={index}
                  className="w-1 bg-gradient-to-t from-green-400 via-emerald-300 to-green-500 rounded-full transition-all duration-1200 ease-out"
                  style={{
                    height: `${Math.max(4, height * 0.6)}px`,
                    animationDelay: `${index * 120}ms`,
                    transform: `scaleY(${
                      1 + Math.sin(Date.now() * 0.0015 + index) * 0.15
                    })`,
                  }}
                />
              ))}
            </div>
          )}

          {/* 진행 바 */}
          <div className="space-y-2">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer hover:h-3 transition-all duration-200 relative overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full relative transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              >
                {/* 재생 중일 때 부드러운 글로우 효과 */}
                {isPlaying && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/50 to-emerald-300/50 animate-pulse"></div>
                )}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-200"></div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 추가 컨트롤 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 셔플 */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>

              {/* 반복 */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* 볼륨 컨트롤 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>

                {/* 볼륨 슬라이더와 퍼센트 */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                        (isMuted ? 0 : volume) * 100
                      }%, #374151 ${
                        (isMuted ? 0 : volume) * 100
                      }%, #374151 100%)`,
                    }}
                  />
                  <div className="text-xs text-gray-400 min-w-[3rem] text-right">
                    {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 트랙 리스트 */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tracksLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 mx-auto border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-green-400 text-sm mt-2">트랙 로딩 중...</p>
              </div>
            ) : (
              tracks.slice(0, 10).map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                    track.track_number === currentTrack
                      ? "bg-green-500/20 text-green-400"
                      : "hover:bg-gray-700/50"
                  }`}
                  onClick={() => changeTrack(track.track_number)}
                >
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs">
                    {track.track_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(track.duration)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
