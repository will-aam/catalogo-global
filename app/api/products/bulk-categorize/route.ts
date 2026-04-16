import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { ids, categoria, selectAllFilters } = await request.json();

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria inválida" },
        { status: 400 },
      );
    }

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};

    // 1. Se o usuário clicou no banner "Selecionar TODOS os milhares de itens"
    if (selectAllFilters) {
      const conditions: Prisma.ProdutoGlobalWhereInput[] = [];
      const { categoriaFiltro, termoBusca } = selectAllFilters;

      if (categoriaFiltro === "SEM_CATEGORIA") {
        conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
      } else if (categoriaFiltro) {
        conditions.push({ categoria: categoriaFiltro });
      }

      if (termoBusca) {
        conditions.push({
          OR: [
            { descricao: { contains: termoBusca, mode: "insensitive" } },
            { codigo_barras: { contains: termoBusca } },
          ],
        });
      }

      whereClause = conditions.length > 0 ? { AND: conditions } : {};
    }
    // 2. Se o usuário selecionou apenas alguns quadradinhos da página atual
    else if (ids && Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      return NextResponse.json(
        { error: "Nenhum item selecionado" },
        { status: 400 },
      );
    }

    // Executa a atualização de uma vez só no banco!
    const resultado = await prisma.produtoGlobal.updateMany({
      where: whereClause,
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
