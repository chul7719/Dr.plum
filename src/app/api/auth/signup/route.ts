// [기능] 회원가입 - 이메일/비밀번호 계정을 만들고 역할(role)을 지정합니다.
// 역할마다 반드시 소속이 있어야 미들웨어/API의 역할 분기가 의미가 있으므로,
// 가입 시점에 소속도 함께 정합니다.
//   MART_MANAGER 기존 지점 선택, 또는 (소속 본사 + 새 지점 이름)으로 지점 생성
//   TECHNICIAN   기존 협력업체 선택, 또는 새 업체 이름으로 업체 생성
//   HQ_ADMIN     새 프랜차이즈 본사(Organization)를 만들면서 그 본사의 첫 관리자가 됨
//
// [주의] 지금은 "기존 지점/업체 선택"에 별도 초대 코드나 승인 절차가 없어서,
// 이메일만 있으면 실제로는 그 지점/업체 소속이 아니어도 선택할 수 있습니다.
// 다음 단계로 초대 코드나 본사 승인 절차를 추가하는 게 좋습니다 (지금은 데모 단계).
// 다만 HQ_ADMIN은 기존 본사에 자유롭게 합류하면 다른 프랜차이즈의 정산·매출
// 데이터까지 볼 수 있게 되므로, 위험을 줄이기 위해 가입 시 새 본사 생성만 허용합니다.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ROLES = ["MART_MANAGER", "TECHNICIAN", "HQ_ADMIN"] as const;
type SignupRole = (typeof ROLES)[number];

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
  }
  if (!ROLES.includes(role as SignupRole)) {
    return NextResponse.json({ error: "올바르지 않은 역할입니다." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // [기능] 매장 담당자 - 기존 지점 선택 또는 (본사 + 새 지점명)으로 지점 생성
  if (role === "MART_MANAGER") {
    const { storeId, organizationId, newStoreName } = body as {
      storeId?: string;
      organizationId?: string;
      newStoreName?: string;
    };

    let finalStoreId = storeId;
    if (!finalStoreId) {
      if (!organizationId || !newStoreName) {
        return NextResponse.json({ error: "소속 본사와 지점 이름을 입력해주세요." }, { status: 400 });
      }
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) return NextResponse.json({ error: "본사를 찾을 수 없습니다." }, { status: 400 });
      const store = await prisma.store.create({ data: { name: newStoreName, organizationId } });
      finalStoreId = store.id;
    }

    await prisma.user.create({
      data: { name, email, passwordHash, role: "MART_MANAGER", storeId: finalStoreId }
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // [기능] 협력업체 기사 - 기존 업체 선택 또는 새 업체 이름으로 업체 생성
  if (role === "TECHNICIAN") {
    const { vendorId, newVendorName } = body as { vendorId?: string; newVendorName?: string };

    let finalVendorId = vendorId;
    if (!finalVendorId) {
      if (!newVendorName) {
        return NextResponse.json({ error: "협력업체 이름을 입력해주세요." }, { status: 400 });
      }
      const vendor = await prisma.vendor.create({ data: { name: newVendorName } });
      finalVendorId = vendor.id;
    }

    await prisma.user.create({
      data: { name, email, passwordHash, role: "TECHNICIAN", vendorId: finalVendorId }
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // [기능] 본사 관리자 - 항상 새 프랜차이즈 본사를 만들면서 그 본사의 관리자가 됨
  const { newOrganizationName } = body as { newOrganizationName?: string };
  if (!newOrganizationName) {
    return NextResponse.json({ error: "본사(프랜차이즈) 이름을 입력해주세요." }, { status: 400 });
  }
  const organization = await prisma.organization.create({ data: { name: newOrganizationName } });
  await prisma.user.create({
    data: { name, email, passwordHash, role: "HQ_ADMIN", organizationId: organization.id }
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
