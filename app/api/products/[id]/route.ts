import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  // 1. A tipagem agora exige que params seja uma Promise
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 2. Precisamos aguardar (await) os parâmetros antes de usar
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const body = await request.json();

    const produtoAtualizado = await prisma.produtoGlobal.update({
      where: { id },
      data: {
        descricao: body.descricao,
        codigo_barras: body.codigo_barras,
        ncm: body.ncm,
        categoria: body.categoria,
        status_auditoria: body.status_auditoria,
      },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 },
    );
  }
}
