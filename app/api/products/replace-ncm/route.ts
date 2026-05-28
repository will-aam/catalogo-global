import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { oldNcm, newNcm } = await request.json();

    if (!oldNcm || !newNcm) {
      return NextResponse.json(
        { error: "NCM antigo e novo são obrigatórios" },
        { status: 400 },
      );
    }

    // Fazemos a substituição em todos os produtos que contenham o NCM antigo
    const resultado = await prisma.produtoGlobal.updateMany({
      where: { ncm: oldNcm },
      data: { ncm: newNcm, status_auditoria: "REVISADO" },
    });

    return NextResponse.json({
      sucesso: true,
      count: resultado.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao substituir NCM" },
      { status: 500 },
    );
  }
}
