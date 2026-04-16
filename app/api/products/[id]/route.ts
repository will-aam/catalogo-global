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
        codigo_barras: body.codigo_barras,
        descricao: body.descricao,
        // O segredo: Se o texto for apenas espaços vazios, transforma em null
        ncm: body.ncm?.trim() === "" ? null : body.ncm,
        marca: body.marca?.trim() === "" ? null : body.marca,
        categoria: body.categoria?.trim() === "" ? null : body.categoria,
        status_auditoria: body.status_auditoria,
      },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error("Erro no PUT:", error);
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
    console.error("Erro no DELETE:", error);
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 },
    );
  }
}
