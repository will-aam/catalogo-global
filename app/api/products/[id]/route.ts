import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrigemClassificacao } from "@prisma/client";
import { ClassificationSuggestions, recordClassificationHistory } from "@/lib/classification-history";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID de produto inválido." }, { status: 400 });
    }

    const origem = body.origemClassificacao === "IA"
      ? OrigemClassificacao.IA
      : OrigemClassificacao.MANUAL;
    const sugestoes = body.sugestoesAuditoria && typeof body.sugestoesAuditoria === "object"
      ? body.sugestoesAuditoria as ClassificationSuggestions
      : {};

    const produtoAtualizado = await prisma.$transaction(async (tx) => {
      const before = await tx.produtoGlobal.findUniqueOrThrow({ where: { id } });
      const updated = await tx.produtoGlobal.update({
        where: { id },
        data: {
          codigo_barras: body.codigo_barras,
          descricao: body.descricao,
          ncm: body.ncm?.trim() === "" ? null : body.ncm,
          marca: body.marca?.trim() === "" ? null : body.marca,
          categoria: body.categoria?.trim() === "" ? null : body.categoria,
          subcategoria:
            body.subcategoria?.trim() === "" ? null : body.subcategoria,
          status_auditoria: "REVISADO",
        },
      });
      await recordClassificationHistory(tx, before, updated, origem, sugestoes, true);
      return updated;
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
