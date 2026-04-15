import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { oldName, newName } = await request.json();

    if (!newName || !oldName) {
      return NextResponse.json({ error: "Nomes inválidos" }, { status: 400 });
    }

    // Se for a categoria especial "Sem Categoria", buscamos null ou vazio
    let whereCondition: any = {};
    if (oldName === "SEM_CATEGORIA") {
      whereCondition = {
        OR: [{ categoria: null }, { categoria: "" }],
      };
    } else {
      whereCondition = { categoria: oldName };
    }

    const resultado = await prisma.produtoGlobal.updateMany({
      where: whereCondition,
      data: {
        categoria: newName,
        status_auditoria: "REVISADO",
      },
    });

    return NextResponse.json({ success: true, count: resultado.count });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao renomear categoria" },
      { status: 500 },
    );
  }
}
