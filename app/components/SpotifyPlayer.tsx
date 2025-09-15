"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSession } from "next-auth/react";
import { SpotifyPlayerState, SpotifyTrack } from "@/types/spotify-playback";
import { playAlbum, playTrack } from "@/lib/spotify";

interface SpotifyPlayerProps {
  className?: string;
}

export interface SpotifyPlayerRef {
  playAlbum: (albumUri: string) => Promise<boolean>;
  playTrack: (trackUri: string) => Promise<boolean>;
  togglePlay: () => Promise<void>;
  getCurrentState: () => SpotifyPlayerState;
}

const SpotifyPlayer = forwardRef<SpotifyPlayerRef, SpotifyPlayerProps>(
  ({ className = "" }, ref) => {
    const { data: session } = useSession();
    const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
      isReady: false,
      isPlaying: false,
      currentTrack: null,
      position: 0,
      duration: 0,
      volume: 50,
      deviceId: null,
      error: null,
    });

    const playerRef = useRef<SpotifyPlayer | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Spotify SDK 로드
    useEffect(() => {
      if (typeof window === "undefined") return;

      // SDK가 이미 로드되었는지 확인
      if (window.Spotify) {
        initializePlayer();
        return;
      }

      // SDK 로드
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("🎵 Spotify Web Playback SDK 로드 완료");
        initializePlayer();
      };

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }, []);

    // Spotify OAuth 토큰 가져오기
    const getSpotifyToken = useCallback(async () => {
      if (!session?.user?.email) return null;

      try {
        // Spotify OAuth 토큰을 가져오는 API 호출 (실제 구현 필요)
        const response = await fetch("/api/spotify/user-token");
        if (response.ok) {
          const data = await response.json();
          return data.access_token;
        }
        return null;
      } catch (error) {
        console.error("❌ Spotify 토큰 가져오기 실패:", error);
        return null;
      }
    }, [session?.user?.email]);

    // 플레이어 초기화
    const initializePlayer = useCallback(async () => {
      if (!window.Spotify) return;

      console.log("🎵 Spotify 플레이어 초기화 시작");

      const spotifyToken = await getSpotifyToken();
      if (!spotifyToken) {
        console.log(
          "⚠️ Spotify OAuth 토큰이 없습니다. Premium 계정 로그인이 필요합니다."
        );
        setPlayerState((prev) => ({
          ...prev,
          error: "Spotify Premium 계정으로 로그인해주세요.",
        }));
        return;
      }

      const player = new window.Spotify.Player({
        name: "My New Song Dashboard Player",
        getOAuthToken: (cb) => {
          cb(spotifyToken);
        },
        volume: 0.5,
      });

      playerRef.current = player;

      // 에러 이벤트
      player.addListener("initialization_error", ({ message }) => {
        console.error("❌ 초기화 에러:", message);
        setPlayerState((prev) => ({ ...prev, error: message }));
      });

      // 인증 에러
      player.addListener("authentication_error", ({ message }) => {
        console.error("❌ 인증 에러:", message);
        setPlayerState((prev) => ({ ...prev, error: message }));
      });

      // 계정 에러
      player.addListener("account_error", ({ message }) => {
        console.error("❌ 계정 에러:", message);
        setPlayerState((prev) => ({ ...prev, error: message }));
      });

      // 재생 에러
      player.addListener("playback_error", ({ message }) => {
        console.error("❌ 재생 에러:", message);
        setPlayerState((prev) => ({ ...prev, error: message }));
      });

      // 플레이어 상태 변경
      player.addListener("player_state_changed", (state) => {
        if (!state) return;

        console.log("🎵 플레이어 상태 변경:", {
          isPlaying: !state.paused,
          track: state.track_window?.current_track?.name,
        });

        setPlayerState((prev) => ({
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window?.current_track || null,
          position: state.position,
          duration: state.track_window?.current_track?.duration_ms || 0,
        }));
      });

      // 플레이어 준비 완료
      player.addListener("ready", ({ device_id }) => {
        console.log("✅ Spotify 플레이어 준비 완료, Device ID:", device_id);
        setPlayerState((prev) => ({
          ...prev,
          isReady: true,
          deviceId: device_id,
          error: null,
        }));
      });

      // 플레이어 연결 안됨
      player.addListener("not_ready", ({ device_id }) => {
        console.log("⚠️ Spotify 플레이어 연결 안됨:", device_id);
        setPlayerState((prev) => ({ ...prev, isReady: false }));
      });

      // 플레이어 연결
      player.connect().then((success) => {
        if (success) {
          console.log("✅ Spotify 플레이어 연결 성공");
        }
      });
    }, [getSpotifyToken]);

    // 포지션 업데이트 (재생 중일 때)
    useEffect(() => {
      if (playerState.isPlaying) {
        intervalRef.current = setInterval(() => {
          setPlayerState((prev) => ({
            ...prev,
            position: prev.position + 1000,
          }));
        }, 1000);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [playerState.isPlaying]);

    // 플레이어 제어 함수들
    const togglePlay = useCallback(async () => {
      if (!playerRef.current) return;
      await playerRef.current.togglePlay();
    }, []);

    const previousTrack = useCallback(async () => {
      if (!playerRef.current) return;
      await playerRef.current.previousTrack();
    }, []);

    const nextTrack = useCallback(async () => {
      if (!playerRef.current) return;
      await playerRef.current.nextTrack();
    }, []);

    const setVolume = useCallback(async (volume: number) => {
      if (!playerRef.current) return;
      await playerRef.current.setVolume(volume / 100);
      setPlayerState((prev) => ({ ...prev, volume }));
    }, []);

    const seekTo = useCallback(async (position: number) => {
      if (!playerRef.current) return;
      await playerRef.current.seek(position);
      setPlayerState((prev) => ({ ...prev, position }));
    }, []);

    // 포지션을 시간 형식으로 변환
    const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // 외부에서 호출할 수 있는 메서드들
    useImperativeHandle(
      ref,
      () => ({
        playAlbum: async (albumUri: string) => {
          if (!playerState.deviceId) return false;
          const token = await getSpotifyToken();
          if (!token) return false;
          return await playAlbum(albumUri, playerState.deviceId, token);
        },
        playTrack: async (trackUri: string) => {
          if (!playerState.deviceId) return false;
          const token = await getSpotifyToken();
          if (!token) return false;
          return await playTrack(trackUri, playerState.deviceId, token);
        },
        togglePlay,
        getCurrentState: () => playerState,
      }),
      [playerState.deviceId, getSpotifyToken, togglePlay, playerState]
    );

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
      return () => {
        if (playerRef.current) {
          playerRef.current.disconnect();
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    // 로그인하지 않은 경우
    if (!session) {
      return null;
    }

    // 에러가 있는 경우
    if (playerState.error) {
      return (
        <div
          className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}
        >
          <div className="flex items-center space-x-2 text-red-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">플레이어 에러: {playerState.error}</span>
          </div>
        </div>
      );
    }

    // 플레이어가 준비되지 않은 경우
    if (!playerState.isReady) {
      return (
        <div
          className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 ${className}`}
        >
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            <span className="text-sm">Spotify 플레이어 연결 중...</span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`bg-gradient-to-r from-gray-900/80 via-gray-800/90 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl ${className}`}
      >
        {/* 현재 트랙 정보 */}
        {playerState.currentTrack ? (
          <div className="flex items-center space-x-4 p-4">
            {/* 앨범 아트 */}
            <div className="flex-shrink-0">
              {playerState.currentTrack.album.images[0] ? (
                <img
                  src={playerState.currentTrack.album.images[0].url}
                  alt={playerState.currentTrack.album.name}
                  className="w-16 h-16 rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🎵</span>
                </div>
              )}
            </div>

            {/* 트랙 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">
                {playerState.currentTrack.name}
              </h3>
              <p className="text-gray-300 text-sm truncate">
                {playerState.currentTrack.artists
                  .map((artist) => artist.name)
                  .join(", ")}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {playerState.currentTrack.album.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">재생할 음악을 선택해주세요</p>
          </div>
        )}

        {/* 진행 바 */}
        {playerState.currentTrack && (
          <div className="px-4 pb-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{formatTime(playerState.position)}</span>
              <div className="flex-1 relative">
                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${
                        (playerState.position / playerState.duration) * 100
                      }%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={playerState.duration}
                  value={playerState.position}
                  onChange={(e) => seekTo(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>
        )}

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-center space-x-4 p-4">
          {/* 이전 트랙 */}
          <button
            onClick={previousTrack}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-gray-700/50 rounded-full"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* 재생/일시정지 */}
          <button
            onClick={togglePlay}
            className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-green-500/25"
          >
            {playerState.isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* 다음 트랙 */}
          <button
            onClick={nextTrack}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-gray-700/50 rounded-full"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* 볼륨 컨트롤 */}
          <div className="flex items-center space-x-2 ml-4">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={playerState.volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    );
  }
);

SpotifyPlayer.displayName = "SpotifyPlayer";

export default SpotifyPlayer;
