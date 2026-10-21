import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrigemClassificacao, Prisma, StatusAuditoria } from "@prisma/client";
import { buildClassificationHistoryRecord } from "@/lib/classification-history";

export async function POST(request: Request) {
  try {
    const { ids, categoria, marca, subcategoria, ncm, selectAllFilters } =
      await request.json();

    // 2. Adicionamos o '!ncm' na validação
    if (!categoria && !marca && !subcategoria && !ncm) {
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 },
      );
    }

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};

    if (selectAllFilters) {
      const conditions: Prisma.ProdutoGlobalWhereInput[] = [];
      const {
        categoriaFiltro,
        termoBusca,
        statusFiltro,
        marcaFiltro,
        subcategoriaFiltro,
        semNcm,
        excludeIds,
      } = selectAllFilters;

      if (categoriaFiltro === "SEM_CATEGORIA") {
        conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
      } else if (categoriaFiltro) {
        conditions.push({ categoria: categoriaFiltro });
      }

      if (marcaFiltro) conditions.push({ marca: marcaFiltro });
      if (subcategoriaFiltro && categoriaFiltro) {
        conditions.push({ subcategoria: subcategoriaFiltro });
      }
      if (semNcm) conditions.push({ OR: [{ ncm: null }, { ncm: "" }] });

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
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      return NextResponse.json(
        { error: "Nenhum item selecionado" },
        { status: 400 },
      );
    }

    const dataToUpdate: Prisma.ProdutoGlobalUpdateInput = {};

    if (categoria) dataToUpdate.categoria = categoria.trim();
    if (marca) dataToUpdate.marca = marca.trim();
    if (subcategoria) dataToUpdate.subcategoria = subcategoria.trim();
    if (ncm) {
      dataToUpdate.ncm = ncm.replace(/\D/g, "");
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const before = await tx.produtoGlobal.findMany({ where: whereClause });
      const updated = await tx.produtoGlobal.updateMany({
        where: whereClause,
        data: dataToUpdate,
      });
      const history = before.flatMap((product) => {
        const after = {
          ...product,
          categoria: categoria ? categoria.trim() : product.categoria,
          subcategoria: subcategoria ? subcategoria.trim() : product.subcategoria,
          marca: marca ? marca.trim() : product.marca,
          ncm: ncm ? ncm.replace(/\D/g, "") : product.ncm,
        };
        const record = buildClassificationHistoryRecord(
          product,
          after,
          OrigemClassificacao.LOTE,
        );
        return record ? [record] : [];
      });
      for (let offset = 0; offset < history.length; offset += 500) {
        await tx.historicoClassificacao.createMany({
          data: history.slice(offset, offset + 500),
        });
      }
      return updated;
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
