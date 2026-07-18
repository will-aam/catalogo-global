import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { oldName, newName } = await request.json();

    if (!newName || !oldName) {
      return NextResponse.json({ error: "Nomes inválidos" }, { status: 400 });
    }

    let whereCondition: Prisma.ProdutoGlobalWhereInput;
    if (oldName === "SEM_CATEGORIA") {
      whereCondition = {
        OR: [{ categoria: null }, { categoria: "" }],
      };
    } else {
      whereCondition = { categoria: oldName };
    }

    const resultado = await prisma.produtoGlobal.updateMany({
      where: whereCondition,
      data: { categoria: newName },
    });

    return NextResponse.json({ success: true, count: resultado.count });
  } catch (error) {
    console.error("Erro ao renomear categoria:", error);
    return NextResponse.json(
      { error: "Erro ao renomear categoria" },
      { status: 500 },
    );
  }
}
