import { PrismaClient } from "@prisma/client";

// Next.js 개발 모드의 hot-reload로 인한 커넥션 중복 생성을 막기 위한 표준 패턴
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
