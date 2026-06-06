// app/api/products/bulk-delete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { ids, selectAllFilters } = await request.json();

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};

    // Se o usuário selecionou "Todos os X itens" de todas as páginas
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
    // Se o usuário selecionou apenas alguns itens específicos na página
    else if (ids && Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      return NextResponse.json(
        { error: "Nenhum item selecionado" },
        { status: 400 },
      );
    }

    // Exclui os produtos em massa
    const resultado = await prisma.produtoGlobal.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({ success: true, count: resultado.count });
  } catch (error) {
    console.error("Erro na exclusão em lote:", error);
    return NextResponse.json(
      { error: "Erro ao excluir itens" },
      { status: 500 },
    );
  }
}
