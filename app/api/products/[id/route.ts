import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
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
    console.error("Erro na API PUT /products/[id]:", error); // <-- Adicionamos isso!
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 },
    );
  }
}
