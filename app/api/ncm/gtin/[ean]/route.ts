import { NextResponse } from "next/server";
import { rscGtinService } from "@/app/api/ncm/rsc-gtin.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ean: string }> }, // 1. Tipamos como Promise
) {
  try {
    const { ean } = await params; // 2. Aguardamos a Promise ser resolvida

    if (!ean) {
      return NextResponse.json({ error: "EAN não fornecido" }, { status: 400 });
    }

    const data = await rscGtinService.fetchProductByEan(ean);

    if (!data) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na rota GTIN:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar GTIN" },
      { status: 500 },
    );
  }
}
