// app/api/import-xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";

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
    const extractedProducts = new Map<
      string,
      { descricao: string; ncm: string | null }
    >();
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
        const ncm = prod.NCM ? String(prod.NCM).trim() : null;
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

    // 2. Busca no banco puxando também a marca atual para sabermos se está vazia
    const produtosExistentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigosParaProcessar } },
      select: { codigo_barras: true, id: true, marca: true },
    });

    const mapaExistentes = new Map<
      string,
      { id: number; marca: string | null }
    >(
      produtosExistentes.map((p) => [
        p.codigo_barras,
        { id: p.id, marca: p.marca },
      ]),
    );

    type ProdutoXMLNovo = {
      codigo_barras: string;
      descricao: string;
      ncm: string | null;
      marca: string | null;
      origem_dado: "XML";
      status_auditoria: "PENDENTE";
    };

    type ProdutoXMLAtualizacao = {
      id: number;
      data: { ncm: string | null; marca?: string };
    };

    const novos: ProdutoXMLNovo[] = [];
    const paraAtualizar: ProdutoXMLAtualizacao[] = [];

    // 3. Distribui os itens aplicando a regra da "Marca"
    for (const [ean, dados] of extractedProducts.entries()) {
      const existing = mapaExistentes.get(ean);

      if (existing) {
        // CORREÇÃO: Removido o "any" e declarada a tipagem exata
        const updateData: { ncm: string | null; marca?: string } = {
          ncm: dados.ncm,
        };

        // Se a marca atual no banco estiver vazia, e você digitou uma marca, preenche!
        if (marca && !existing.marca) {
          updateData.marca = marca;
        }
        paraAtualizar.push({ id: existing.id, data: updateData });
      } else {
        novos.push({
          codigo_barras: ean,
          descricao: dados.descricao,
          ncm: dados.ncm,
          marca: marca, // <--- Aplica a marca nova aqui
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
    });
  } catch (error) {
    console.error("Erro na importação de lote de XML:", error);
    return NextResponse.json(
      { error: "Falha ao processar o lote de XML" },
      { status: 500 },
    );
  }
}
