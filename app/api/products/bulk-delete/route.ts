// app/api/products/bulk-delete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StatusAuditoria } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { ids, selectAllFilters } = await request.json();

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};

    // Se o usuário selecionou "Todos os X itens" de todas as páginas
    if (selectAllFilters) {
      const conditions: Prisma.ProdutoGlobalWhereInput[] = [];
      const {
        categoriaFiltro,
        termoBusca,
        statusFiltro,
        marcaFiltro,
        subcategoriaFiltro,
        semNcm,
        ncmIncorreto,
        excludeIds,
      } = selectAllFilters;

      if (categoriaFiltro === "SEM_CATEGORIA") {
        conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
      } else if (categoriaFiltro) {
        conditions.push({ categoria: categoriaFiltro });
      }

      if (marcaFiltro) conditions.push({ marca: marcaFiltro });
      if (subcategoriaFiltro) {
        conditions.push({ subcategoria: subcategoriaFiltro });
      }
      if (semNcm) conditions.push({ OR: [{ ncm: null }, { ncm: "" }] });

      if (ncmIncorreto) {
        const invalidIdsResult = await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM "produtos_globais"
          WHERE "ncm" IS NOT NULL AND "ncm" != '' AND "ncm" !~ '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
        `;
        const invalidIds = invalidIdsResult.map((r) => r.id);
        conditions.push({ id: { in: invalidIds.length > 0 ? invalidIds : [-1] } });
      }

      if (termoBusca) {
        conditions.push({
          OR: [
            { descricao: { contains: termoBusca, mode: "insensitive" } },
            { codigo_barras: { contains: termoBusca } },
          ],
        });
      }

      if (Object.values(StatusAuditoria).includes(statusFiltro as StatusAuditoria)) {
        conditions.push({ status_auditoria: statusFiltro as StatusAuditoria });
      }
      if (Array.isArray(excludeIds) && excludeIds.length > 0) {
        conditions.push({ id: { notIn: excludeIds } });
      }

      whereClause = conditions.length > 0 ? { AND: conditions } : {};
    }
    // Se o usuário selecionou apenas alguns itens específicos na página
    else if (ids && Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      return NextResponse.json(
        { error: "Nenhum produto selecionado para exclusão." },
        { status: 400 },
      );
    }

    const deleteResult = await prisma.produtoGlobal.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      count: deleteResult.count,
    });
  } catch (error) {
    console.error("Erro na exclusão em lote:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir produtos." },
      { status: 500 },
    );
  }
}
