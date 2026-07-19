// app/api/import-xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";

type ProdutoExtraido = {
  descricao: string;
  ncm: string | null;
};

type ExistenteBanco = {
  id: number;
  marca: string | null;
  ncm: string | null;
};

type ProdutoXMLNovo = {
  codigo_barras: string;
  descricao: string;
  ncm: string | null;
  marca: string | null;
  origem_dado: "XML";
  status_auditoria: "PENDENTE";
};

type AtualizacaoDados = {
  ncm?: string;
  marca?: string;
};

type ProdutoXMLAtualizacao = {
  id: number;
  data: AtualizacaoDados;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    // Pegamos a marca que o usuário digitou lá na tela
    const marcaInput = formData.get("marca") as string | null;
    const marca = marcaInput?.trim() || null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo encontrado" },
        { status: 400 },
      );
    }

    const parser = new XMLParser({
      ignoreAttributes: true,
      removeNSPrefix: true,
    });

    const extractedProducts = new Map<string, ProdutoExtraido>();
    const isValidEan = (code: string) =>
      code && code.toUpperCase() !== "SEM GTIN";

    // 1. Abre todos os XMLs enviados no lote e junta tudo no grande Map
    for (const file of files) {
      const xmlText = await file.text();
      const jsonObj = parser.parse(xmlText);

      let detNodes =
        jsonObj?.nfeProc?.NFe?.infNFe?.det || jsonObj?.NFe?.infNFe?.det;
      if (!detNodes) continue;

      if (!Array.isArray(detNodes)) detNodes = [detNodes];

      for (const item of detNodes) {
        const prod = item.prod;
        if (!prod) continue;

        const xProd = prod.xProd ? String(prod.xProd).trim() : "SEM DESCRIÇÃO";

        // Só considera o NCM se ele realmente vier preenchido no XML.
        // Se vier vazio/ausente, guardamos como null e NÃO vamos
        // sobrescrever o que já existe no banco lá na frente.
        const ncmRaw = prod.NCM ? String(prod.NCM).trim() : "";
        const ncm = ncmRaw.length > 0 ? ncmRaw : null;

        const cEAN = prod.cEAN ? String(prod.cEAN).trim() : "";
        const cEANTrib = prod.cEANTrib ? String(prod.cEANTrib).trim() : "";

        if (isValidEan(cEAN)) {
          extractedProducts.set(cEAN, { descricao: xProd, ncm });
        }
        if (isValidEan(cEANTrib) && cEANTrib !== cEAN) {
          extractedProducts.set(cEANTrib, { descricao: xProd, ncm });
        }
      }
    }

    const codigosParaProcessar = Array.from(extractedProducts.keys());
    if (codigosParaProcessar.length === 0) {
      return NextResponse.json(
        { error: "Nenhum código de barras válido nas notas" },
        { status: 400 },
      );
    }

    // 2. Busca no banco puxando também o NCM e a marca atuais,
    // pra sabermos se realmente muda algo
    const produtosExistentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigosParaProcessar } },
      select: { codigo_barras: true, id: true, marca: true, ncm: true },
    });

    const mapaExistentes = new Map<string, ExistenteBanco>(
      produtosExistentes.map((p) => [
        p.codigo_barras,
        { id: p.id, marca: p.marca, ncm: p.ncm },
      ]),
    );

    const novos: ProdutoXMLNovo[] = [];
    const paraAtualizar: ProdutoXMLAtualizacao[] = [];

    // Contadores pra dar um retorno mais detalhado no final
    let ncmAtualizados = 0;
    let marcaAtualizada = 0;

    // 3. Distribui os itens aplicando as regras de "NCM" e "Marca"
    for (const [ean, dados] of extractedProducts.entries()) {
      const existing = mapaExistentes.get(ean);

      if (existing) {
        const updateData: AtualizacaoDados = {};

        // Só mexe no NCM se o XML trouxe um valor válido E ele é diferente
        // do que já está salvo. Se o XML não tem NCM, nem entra aqui.
        if (dados.ncm && dados.ncm !== existing.ncm) {
          updateData.ncm = dados.ncm;
          ncmAtualizados++;
        }

        // Se a marca atual no banco estiver vazia, e você digitou uma marca, preenche!
        if (marca && !existing.marca) {
          updateData.marca = marca;
          marcaAtualizada++;
        }

        // Só manda pro banco se realmente tem algo pra atualizar
        if (Object.keys(updateData).length > 0) {
          paraAtualizar.push({ id: existing.id, data: updateData });
        }
      } else {
        novos.push({
          codigo_barras: ean,
          descricao: dados.descricao,
          ncm: dados.ncm,
          marca: marca,
          origem_dado: "XML",
          status_auditoria: "PENDENTE",
        });
      }
    }

    // 4. Executa a transação no banco
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
      ncmAtualizados,
      marcaAtualizada,
      totalCodigos: codigosParaProcessar.length,
    });
  } catch (error) {
    console.error("Erro na importação de lote de XML:", error);
    return NextResponse.json(
      { error: "Falha ao processar o lote de XML" },
      { status: 500 },
    );
  }
}
