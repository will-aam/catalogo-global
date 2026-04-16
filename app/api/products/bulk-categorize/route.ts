import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { ids, categoria } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !categoria) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const resultado = await prisma.produtoGlobal.updateMany({
      where: { id: { in: ids } },
      data: {
        categoria: categoria.trim(),
        status_auditoria: "REVISADO",
      },
    });

    return NextResponse.json({ success: true, count: resultado.count });
  } catch (error) {
    console.error("Erro na categorização em lote:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar itens" },
      { status: 500 },
    );
  }
}
