import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parâmetros da requisição
    const codigoBarras = searchParams.get("codigo_barras");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // --- MODO 1: BUSCA RÁPIDA (SCANNER) ---
    // Se o sistema de contagem mandou um código de barras, devolvemos só aquele item
    if (codigoBarras) {
      const produto = await prisma.produtoGlobal.findUnique({
        where: { codigo_barras: codigoBarras },
        select: {
          id: true,
          codigo_barras: true,
          descricao: true,
          ncm: true,
          categoria: true,
          subcategoria: true, // O nosso campo novo já está aqui!
          marca: true,
        },
      });

      if (!produto) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json(produto);
    }

    // --- MODO 2: SINCRONIZAÇÃO EM MASSA (CATÁLOGO GERAL) ---
    // Se não mandou código, devolvemos uma lista paginada
    const produtos = await prisma.produtoGlobal.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        codigo_barras: true,
        descricao: true,
        ncm: true,
        categoria: true,
        subcategoria: true,
        marca: true,
      },
      orderBy: { id: "asc" }, // Ordem padrão para garantir que a sincronização não pule itens
    });

    const total = await prisma.produtoGlobal.count();

    return NextResponse.json({
      dados: produtos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro na API V1 de Produtos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar produtos" },
      { status: 500 },
    );
  }
}
