import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

type ProdutoImportacao = {
  codigo_barras: string;
  descricao: string;
  ncm: string | null;
  categoria: string | null;
  subcategoria: string | null;
  marca: string | null;
  status_auditoria: "PENDENTE";
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 400 },
      );
    }

    const text = await file.text();

    const { data, errors } = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (errors?.length) {
      return NextResponse.json(
        { error: "CSV inválido", detalhes: errors.map((e) => e.message) },
        { status: 400 },
      );
    }

    if (!data || data.length < 2) {
      return NextResponse.json(
        { error: "Planilha vazia ou sem linhas de dados" },
        { status: 400 },
      );
    }

    const linhas = data.slice(1); // remove cabeçalho

    // 1) Extrai todos os códigos de barras da planilha
    const codigosPlanilha = linhas
      .map((l) => l?.[0]?.trim())
      .filter((v): v is string => Boolean(v));

    if (codigosPlanilha.length === 0) {
      return NextResponse.json(
        { error: "Nenhum código de barras válido encontrado" },
        { status: 400 },
      );
    }

    // 2) Busca produtos já existentes
    const produtosExistentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigosPlanilha } },
      select: { codigo_barras: true, id: true },
    });

    const mapaExistentes = new Map<string, number>(
      produtosExistentes.map((p) => [p.codigo_barras, p.id]),
    );

    const novos: ProdutoImportacao[] = [];
    const paraAtualizar: { id: number; data: ProdutoImportacao }[] = [];

    // 3) Separa novos e atualizações
    for (const linha of linhas) {
      const ean = linha?.[0]?.trim();
      if (!ean) continue;

      const dados: ProdutoImportacao = {
        codigo_barras: ean,
        descricao: linha?.[1]?.trim() || "SEM DESCRIÇÃO",
        ncm: linha?.[2]?.trim() || null,
        categoria: linha?.[3]?.trim() || null,
        subcategoria: linha?.[4]?.trim() || null, // NOVO CAMPO
        marca: linha?.[5]?.trim() || null, // marca agora é a 6ª coluna
        status_auditoria: "PENDENTE",
      };

      const existingId = mapaExistentes.get(ean);

      if (typeof existingId === "number") {
        paraAtualizar.push({ id: existingId, data: dados });
      } else {
        novos.push(dados);
      }
    }

    // 4) Transação
    await prisma.$transaction([
      prisma.produtoGlobal.createMany({
        data: novos,
        skipDuplicates: true,
      }),
      ...paraAtualizar.map((p) =>
        prisma.produtoGlobal.update({
          where: { id: p.id },
          data: p.data,
        }),
      ),
    ]);

    return NextResponse.json({
      sucesso: true,
      criados: novos.length,
      atualizados: paraAtualizar.length,
      total_processado: novos.length + paraAtualizar.length,
    });
  } catch (error) {
    console.error("Erro na importação CSV:", error);
    return NextResponse.json(
      { error: "Erro ao processar importação" },
      { status: 500 },
    );
  }
}
