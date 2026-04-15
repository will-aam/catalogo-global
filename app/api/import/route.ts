import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    }

    // Lê o conteúdo do arquivo CSV como texto
    const text = await file.text();

    // Faz o parse (leitura) ignorando o nome dos cabeçalhos (header: false)
    // Isso transforma cada linha num array simples: [codigo, descricao, grupo, marca, ncm]
    const { data } = Papa.parse(text, {
      header: false,
      skipEmptyLines: true, // Ignora linhas em branco no final do arquivo
    });

    // Removemos a primeira linha (índice 0) assumindo que é o cabeçalho ("Código", "Descrição", etc.)
    const linhas = data.slice(1) as string[][];

    // Mapeamento organizado
    const produtosParaInserir = linhas
      .map((linha) => {
        return {
          codigo_barras: linha[0]?.trim(),
          descricao: linha[1]?.trim() || "SEM DESCRIÇÃO",
          categoria: linha[2]?.trim() || null, // Se vier vazio, vira null
          marca: linha[3]?.trim() || null, // Se vier vazio, vira null
          ncm: linha[4]?.trim() || null,
          origem_dado: file.name, // Salva o nome do arquivo (ex: "planilha.csv") para auditoria
          status_auditoria: "PENDENTE" as const,
        };
      })
      .filter((p) => p.codigo_barras); // Filtro de segurança: só insere se tiver código de barras

    // Inserção em Massa (Batch Insert)
    const resultado = await prisma.produtoGlobal.createMany({
      data: produtosParaInserir,
      skipDuplicates: true, // MAGIA AQUI: Se o código já existir, ele ignora e não quebra o sistema
    });

    return NextResponse.json({
      sucesso: true,
      inseridos: resultado.count,
      total_lido: produtosParaInserir.length,
    });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o arquivo." },
      { status: 500 },
    );
  }
}
