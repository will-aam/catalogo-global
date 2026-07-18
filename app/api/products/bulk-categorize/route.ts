import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { ids, categoria, marca, subcategoria, selectAllFilters } =
      await request.json();

    if (!categoria && !marca && !subcategoria) {
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 },
      );
    }

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};

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

    const resultado = await prisma.produtoGlobal.updateMany({
      where: whereClause,
      data: dataToUpdate,
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
