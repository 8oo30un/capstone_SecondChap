import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 실제 구현에서는 여기서 Spotify OAuth 토큰을 가져와야 합니다
    // 현재는 플레이어가 작동하지 않을 것임을 알려주는 메시지 반환
    return NextResponse.json(
      {
        error: "Spotify Premium 계정과 OAuth 연동이 필요합니다.",
        message:
          "현재는 Spotify Web Playback SDK를 위한 OAuth 설정이 완료되지 않았습니다.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("❌ Spotify 사용자 토큰 가져오기 실패:", error);
    return NextResponse.json({ error: "토큰 가져오기 실패" }, { status: 500 });
  }
}
