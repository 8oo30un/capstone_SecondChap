import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/auth";

const prisma = new PrismaClient();

// 즐겨찾기 조회
export async function GET() {
  console.log("GET /api/favorites called");
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in GET:", session);

    if (!session?.user?.id) {
      console.log("No user ID in session");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("즐겨찾기 조회 오류:", error);
    return NextResponse.json(
      { error: "즐겨찾기 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 즐겨찾기 추가
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in POST:", session);

    if (!session?.user?.id) {
      console.log("No user ID in session");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 400 }
      );
    }

    const { type, spotifyId, name, image } = await request.json();

    if (!type || !spotifyId || !name) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_spotifyId_type: {
          userId: session.user.id,
          spotifyId,
          type,
        },
      },
      update: {
        name,
        image,
      },
      create: {
        userId: session.user.id,
        type,
        spotifyId,
        name,
        image,
      },
    });

    return NextResponse.json(favorite);
  } catch (error) {
    console.error("즐겨찾기 추가 오류:", error);
    return NextResponse.json(
      { error: "즐겨찾기 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 즐겨찾기 삭제
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ DELETE 요청 시작");
    const session = await getServerSession(authOptions);
    console.log("Session in DELETE:", session);
    console.log("User ID in session:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("❌ No user ID in session");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
    console.log("📥 DELETE 요청 본문:", requestBody);

    const { type, spotifyId } = requestBody;
    console.log("🔍 추출된 데이터:", {
      type,
      spotifyId,
      userId: session.user.id,
    });

    if (!type || !spotifyId) {
      console.log("❌ 필수 정보 누락:", { type, spotifyId });
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    console.log("🗑️ Prisma 삭제 쿼리 실행:", {
      userId: session.user.id,
      spotifyId,
      type,
    });

    const deleteResult = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        spotifyId,
        type,
      },
    });

    console.log("✅ Prisma 삭제 결과:", deleteResult);
    console.log("🗑️ 삭제된 레코드 수:", deleteResult.count);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      deletedItem: { type, spotifyId, userId: session.user.id },
    });
  } catch (error) {
    console.error("💥 즐겨찾기 삭제 오류:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "즐겨찾기 삭제에 실패했습니다.", details: errorMessage },
      { status: 500 }
    );
  }
}
