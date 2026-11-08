import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrigemClassificacao, Prisma } from "@prisma/client";
import { ClassificationSuggestions, recordClassificationHistory } from "@/lib/classification-history";
import { formatNcm } from "@/lib/ncm";

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

    const codigoBarras = body.codigo_barras?.toString().trim() || null;

    // Verificação antecipada de unicidade do código de barras
    if (codigoBarras) {
      const existingProduct = await prisma.produtoGlobal.findFirst({
        where: {
          codigo_barras: codigoBarras,
          id: { not: id },
        },
        select: {
          id: true,
          descricao: true,
          codigo_barras: true,
        },
      });

      if (existingProduct) {
        return NextResponse.json(
          {
            error: `O código de barras "${codigoBarras}" já pertence ao produto "${existingProduct.descricao}" (ID #${existingProduct.id}). Não é possível duplicar códigos de barras no catálogo.`,
            code: "DUPLICATE_BARCODE",
            duplicateId: existingProduct.id,
            duplicateDescricao: existingProduct.descricao,
          },
          { status: 409 },
        );
      }
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
          codigo_barras: codigoBarras,
          descricao: body.descricao,
          ncm: body.ncm?.trim() === "" ? null : formatNcm(body.ncm),
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined) || [];
      if (target.includes("codigo_barras")) {
        return NextResponse.json(
          {
            error: "Já existe outro produto cadastrado com este código de barras no catálogo.",
            code: "DUPLICATE_BARCODE",
          },
          { status: 409 },
        );
      }
    }

    console.error("Erro no PUT:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto. Verifique os dados e tente novamente." },
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
