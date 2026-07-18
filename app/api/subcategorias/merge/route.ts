import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { sourceName, targetName } = await request.json();

    if (!sourceName || !targetName) {
      return NextResponse.json(
        { error: "sourceName e targetName são obrigatórios" },
        { status: 400 },
      );
    }

    if (sourceName === targetName) {
      return NextResponse.json(
        { error: "Os nomes devem ser diferentes" },
        { status: 400 },
      );
    }

    const result = await prisma.produtoGlobal.updateMany({
      where: { subcategoria: sourceName },
      data: { subcategoria: targetName },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("Erro ao mesclar subcategorias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
