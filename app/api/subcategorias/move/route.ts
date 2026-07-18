import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { subcategoria, fromCategoria, toCategoria } = await request.json();

    if (!subcategoria || !fromCategoria || !toCategoria) {
      return NextResponse.json(
        { error: "subcategoria, fromCategoria e toCategoria são obrigatórios" },
        { status: 400 },
      );
    }

    if (fromCategoria === toCategoria) {
      return NextResponse.json(
        { error: "As categorias de origem e destino devem ser diferentes" },
        { status: 400 },
      );
    }

    const result = await prisma.produtoGlobal.updateMany({
      where: {
        subcategoria: subcategoria,
        categoria: fromCategoria,
      },
      data: { categoria: toCategoria },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("Erro ao mover subcategoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
