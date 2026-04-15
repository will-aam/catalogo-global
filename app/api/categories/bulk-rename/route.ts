import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { oldName, newName } = await request.json();

    if (!oldName || !newName) {
      return NextResponse.json({ error: "Nomes inválidos" }, { status: 400 });
    }

    const resultado = await prisma.produtoGlobal.updateMany({
      where: { categoria: oldName },
      data: {
        categoria: newName,
        status_auditoria: "REVISADO",
      },
    });

    return NextResponse.json({
      success: true,
      count: resultado.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao renomear categoria" },
      { status: 500 },
    );
  }
}
