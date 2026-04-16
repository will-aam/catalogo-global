import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 400 },
      );

    const text = await file.text();
    const { data } = Papa.parse(text, { header: false, skipEmptyLines: true });
    const linhas = data.slice(1) as string[][]; // Remove o cabeçalho

    // 1. Extrai todos os códigos de barras da planilha para uma busca única
    const codigosPlanilha = linhas.map((l) => l[0]?.trim()).filter(Boolean);

    // 2. Busca o que já existe no banco
    const produtosExistentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigosPlanilha } },
      select: { codigo_barras: true, id: true },
    });

    const mapaExistentes = new Map(
      produtosExistentes.map((p) => [p.codigo_barras, p.id]),
    );

    const novos: any[] = [];
    const paraAtualizar: any[] = [];

    // 3. Separa quem é novo e quem é atualização
    for (const linha of linhas) {
      const ean = linha[0]?.trim();
      if (!ean) continue;

      const dados = {
        codigo_barras: ean,
        descricao: linha[1]?.trim() || "SEM DESCRIÇÃO",
        ncm: linha[2]?.trim() || null,
        categoria: linha[3]?.trim() || null,
        marca: linha[4]?.trim() || null,
        status_auditoria: "PENDENTE" as const,
      };

      if (mapaExistentes.has(ean)) {
        paraAtualizar.push({ id: mapaExistentes.get(ean), data: dados });
      } else {
        novos.push(dados);
      }
    }

    // 4. Executa as operações em bloco (Transaction)
    await prisma.$transaction([
      // Insere os novos de uma vez (Rápido)
      prisma.produtoGlobal.createMany({ data: novos, skipDuplicates: true }),

      // Atualiza os existentes (Um por um, mas dentro da transação)
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
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao processar importação" },
      { status: 500 },
    );
  }
}
