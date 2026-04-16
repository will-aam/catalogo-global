import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
        marca: body.marca, // <-- COLUNA NOVA ADICIONADA AQUI!
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.produtoGlobal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 },
    );
  }
}
