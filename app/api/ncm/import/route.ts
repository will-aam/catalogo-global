import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: Array<{ codigo: string; descricao: string }> = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item válido enviado." },
        { status: 400 },
      );
    }

    const BATCH_SIZE = 500;
    let imported = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE).map((item) => ({
        codigo: item.codigo,
        descricao: item.descricao,
      }));

      const result = await prisma.nCM.createMany({
        data: batch,
        skipDuplicates: true,
      });

      imported += result.count;
    }

    return NextResponse.json({ imported });
  } catch (error) {
    console.error("Erro ao importar NCMs:", error);
    return NextResponse.json(
      { error: "Erro ao importar NCMs no banco." },
      { status: 500 },
    );
  }
}
