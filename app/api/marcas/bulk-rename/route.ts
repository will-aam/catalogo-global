import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { oldName, newName } = await request.json();

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "oldName e newName são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await prisma.produtoGlobal.updateMany({
      where: { marca: oldName },
      data: { marca: newName },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("Erro ao renomear marcas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
