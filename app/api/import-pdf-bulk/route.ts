// app/api/import-pdf-bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. Definimos o que vem da tela de triagem
type ProdutoImportado = {
  codigo_barras: string;
  descricao: string;
  ncm?: string;
  marca?: string;
};

// 2. Definimos o molde para produtos novos
type NovoProdutoDB = {
  codigo_barras: string;
  descricao: string;
  ncm: string | null;
  marca: string | null;
  status_auditoria: "PENDENTE";
};

// 3. Definimos o molde para atualização
type AtualizaProdutoDB = {
  ncm?: string;
  marca?: string;
};

type PayloadAtualizacao = {
  id: number;
  data: AtualizaProdutoDB;
};

export async function POST(request: Request) {
  try {
    const { produtos } = (await request.json()) as {
      produtos: ProdutoImportado[];
    };

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto enviado" },
        { status: 400 },
      );
    }

    const codigos = produtos.map((p) => p.codigo_barras);

    // Verifica quais os códigos que já existem na base de dados
    const existentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigos } },
      select: { codigo_barras: true, id: true },
    });

    const mapaExistentes = new Map(
      existentes.map((p) => [p.codigo_barras, p.id]),
    );

    // Arrays com tipagem estrita no lugar do "any"
    const novos: NovoProdutoDB[] = [];
    const paraAtualizar: PayloadAtualizacao[] = [];

    for (const p of produtos) {
      const existingId = mapaExistentes.get(p.codigo_barras);

      if (typeof existingId === "number") {
        // Se já existe, atualizamos a marca ou NCM caso tenham sido preenchidos na triagem
        const dadosAtualizar: AtualizaProdutoDB = {};
        if (p.ncm) dadosAtualizar.ncm = p.ncm;
        if (p.marca) dadosAtualizar.marca = p.marca;

        if (Object.keys(dadosAtualizar).length > 0) {
          paraAtualizar.push({ id: existingId, data: dadosAtualizar });
        }
      } else {
        // Se é novo, criamos com os dados completos
        novos.push({
          codigo_barras: p.codigo_barras,
          descricao: p.descricao,
          ncm: p.ncm || null,
          marca: p.marca || null,
          status_auditoria: "PENDENTE",
        });
      }
    }

    // Executa as operações em bloco
    await prisma.$transaction([
      prisma.produtoGlobal.createMany({ data: novos, skipDuplicates: true }),
      ...paraAtualizar.map((p) =>
        prisma.produtoGlobal.update({ where: { id: p.id }, data: p.data }),
      ),
    ]);

    return NextResponse.json({
      sucesso: true,
      criados: novos.length,
      atualizados: paraAtualizar.length,
    });
  } catch (error) {
    console.error("Erro na importação em lote do PDF:", error);
    return NextResponse.json(
      { error: "Falha ao guardar os dados" },
      { status: 500 },
    );
  }
}
