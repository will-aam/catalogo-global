// app/api/products/replace-ncm/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatNcm, cleanNcm } from "@/lib/ncm";

export async function POST(request: Request) {
  try {
    const { oldNcm, newNcm } = await request.json();

    if (!oldNcm || !newNcm) {
      return NextResponse.json(
        { error: "NCM antigo e novo são obrigatórios" },
        { status: 400 },
      );
    }

    const formattedOld = formatNcm(oldNcm);
    const cleanedOld = cleanNcm(oldNcm);
    const formattedNew = formatNcm(newNcm);

    // Fazemos a substituição em todos os produtos que contenham o NCM antigo (com ou sem pontuação)
    const targets = Array.from(new Set([formattedOld, cleanedOld, oldNcm.trim()].filter(Boolean)));

    const resultado = await prisma.produtoGlobal.updateMany({
      where: {
        ncm: {
          in: targets,
        },
      },
      data: { ncm: formattedNew, status_auditoria: "REVISADO" },
    });

    return NextResponse.json({
      sucesso: true,
      count: resultado.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao substituir NCM" },
      { status: 500 },
    );
  }
}
