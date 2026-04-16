import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 1. Busca todos que têm a coluna marca preenchida
    const errados = await prisma.produtoGlobal.findMany({
      where: {
        AND: [{ marca: { not: null } }, { marca: { not: "" } }],
      },
    });

    let corrigidos = 0;

    // 2. Loop de verificação inteligente
    for (const item of errados) {
      if (!item.marca) continue;

      // Regex que checa se a string contém APENAS números, pontos e espaços
      // Se tiver qualquer letra, o isNcm será 'false'
      const isNcm = /^[\d\.\s]+$/.test(item.marca.trim());

      if (isNcm) {
        await prisma.produtoGlobal.update({
          where: { id: item.id },
          data: {
            ncm: item.marca, // Move para o NCM
            marca: null, // Esvazia a marca
          },
        });
        corrigidos++;
      }
    }

    return NextResponse.json({ success: true, count: corrigidos });
  } catch (error) {
    console.error("Erro ao corrigir:", error);
    return NextResponse.json(
      { error: "Erro ao corrigir colunas" },
      { status: 500 },
    );
  }
}
