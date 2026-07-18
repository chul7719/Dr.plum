// [기능] 공지사항 수정(PATCH)/삭제(DELETE) - 자기 본사 소속 공지만 가능
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnedNotice(organizationId: string, noticeId: string) {
  const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
  if (!notice || notice.organizationId !== organizationId) return null;
  return notice;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedNotice(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });

  const { title, content } = (await req.json()) as { title?: string; content?: string };
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const notice = await prisma.notice.update({
    where: { id: params.id },
    data: { title: title.trim(), content: content.trim() }
  });

  return NextResponse.json({ notice });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedNotice(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });

  await prisma.notice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
