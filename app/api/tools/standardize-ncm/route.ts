import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const updated8 = await prisma.$executeRaw`
      UPDATE "produtos_globais"
      SET "ncm" = SUBSTRING("ncm" FROM 1 FOR 4) || '.' || SUBSTRING("ncm" FROM 5 FOR 2) || '.' || SUBSTRING("ncm" FROM 7 FOR 2)
      WHERE "ncm" IS NOT NULL AND "ncm" ~ '^[0-9]{8}$'
    `;

    const updated7 = await prisma.$executeRaw`
      UPDATE "produtos_globais"
      SET "ncm" = '0' || SUBSTRING("ncm" FROM 1 FOR 3) || '.' || SUBSTRING("ncm" FROM 4 FOR 2) || '.' || SUBSTRING("ncm" FROM 6 FOR 2)
      WHERE "ncm" IS NOT NULL AND "ncm" ~ '^[0-9]{7}$'
    `;

    const invalid = await prisma.$queryRaw<Array<{ id: number; ncm: string; descricao: string }>>`
      SELECT id, ncm, descricao FROM "produtos_globais"
      WHERE "ncm" IS NOT NULL AND "ncm" != '' AND "ncm" !~ '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
      LIMIT 100
    `;

    const totalInvalid = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*)::int as count FROM "produtos_globais"
      WHERE "ncm" IS NOT NULL AND "ncm" != '' AND "ncm" !~ '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
    `;

    return NextResponse.json({
      success: true,
      updated8,
      updated7,
      totalPadronizados: updated8 + updated7,
      totalInvalidos: totalInvalid[0]?.count || 0,
      exemplosInvalidos: invalid,
    });
  } catch (error) {
    console.error("Erro ao padronizar NCMs:", error);
    return NextResponse.json(
      { error: "Erro ao executar padronização de NCMs." },
      { status: 500 },
    );
  }
}
