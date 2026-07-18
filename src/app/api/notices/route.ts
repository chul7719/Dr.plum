// [기능] 본사 공지사항 게시판 - 목록 조회(GET, 매장 담당자+기사+본사 모두) + 작성(POST, 본사만)
// 매장 담당자는 소속 지점의 본사, 기사는 소속 업체의 본사(있으면) 기준으로
// 자기 본사 공지만 봅니다 (src/lib/org-scope.ts).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrganizationId } from "@/lib/org-scope";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const organizationId = await resolveOrganizationId(session);
  if (!organizationId) return NextResponse.json({ notices: [] });

  const notices = await prisma.notice.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ notices });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { title, content } = (await req.json()) as { title?: string; content?: string };
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const notice = await prisma.notice.create({
    data: { title: title.trim(), content: content.trim(), organizationId: session.user.organizationId }
  });

  return NextResponse.json({ notice }, { status: 201 });
}
