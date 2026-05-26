import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SelectAllFilters = {
  categoriaFiltro?: string | null;
  termoBusca?: string | null;
};

type RequestBody = {
  ids?: unknown;
  categoria?: unknown;
  selectAllFilters?: SelectAllFilters | null;
};

// Tipos “mínimos” (sem Prisma) só com os campos que este endpoint usa
type WhereStringContainsInsensitive = { contains: string; mode: "insensitive" };
type WhereStringContains = { contains: string };

type ProdutoGlobalWhereInput = {
  AND?: ProdutoGlobalWhereInput[];
  OR?: ProdutoGlobalWhereInput[];
  categoria?: string | null;
  descricao?: WhereStringContainsInsensitive;
  codigo_barras?: WhereStringContains;
  id?: { in: number[] };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { ids, categoria, selectAllFilters } = body;

    if (typeof categoria !== "string" || !categoria.trim()) {
      return NextResponse.json(
        { error: "Categoria inválida" },
        { status: 400 },
      );
    }

    let whereClause: ProdutoGlobalWhereInput = {};

    // 1. Se o usuário clicou no banner "Selecionar TODOS os milhares de itens"
    if (selectAllFilters) {
      const conditions: ProdutoGlobalWhereInput[] = [];
      const { categoriaFiltro, termoBusca } = selectAllFilters;

      if (categoriaFiltro === "SEM_CATEGORIA") {
        conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
      } else if (typeof categoriaFiltro === "string" && categoriaFiltro) {
        conditions.push({ categoria: categoriaFiltro });
      }

      if (typeof termoBusca === "string" && termoBusca) {
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
    else if (Array.isArray(ids) && ids.length > 0) {
      const parsedIds = ids.filter((x): x is number => typeof x === "number");
      if (parsedIds.length === 0) {
        return NextResponse.json(
          { error: "Nenhum item selecionado" },
          { status: 400 },
        );
      }
      whereClause = { id: { in: parsedIds } };
    } else {
      return NextResponse.json(
        { error: "Nenhum item selecionado" },
        { status: 400 },
      );
    }

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
