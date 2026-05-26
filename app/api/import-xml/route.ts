import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 400 },
      );

    const xmlText = await file.text();

    // Configuração para ignorar atributos e remover namespaces (nfe:) para ler qualquer XML de nota
    const parser = new XMLParser({
      ignoreAttributes: true,
      removeNSPrefix: true,
    });
    const jsonObj = parser.parse(xmlText);

    // Navega até a tag de produtos da NF-e
    let detNodes =
      jsonObj?.nfeProc?.NFe?.infNFe?.det || jsonObj?.NFe?.infNFe?.det;

    if (!detNodes) {
      return NextResponse.json(
        { error: "XML inválido ou sem produtos" },
        { status: 400 },
      );
    }

    // Se tiver apenas 1 produto, o XMLParser não cria array, então forçamos ser array
    if (!Array.isArray(detNodes)) detNodes = [detNodes];

    // Usamos um Map para evitar tentar inserir o mesmo código de barras duas vezes na mesma nota
    const extractedProducts = new Map<
      string,
      { descricao: string; ncm: string | null }
    >();

    for (const item of detNodes) {
      const prod = item.prod;
      if (!prod) continue;

      const xProd = prod.xProd ? String(prod.xProd).trim() : "SEM DESCRIÇÃO";
      const ncm = prod.NCM ? String(prod.NCM).trim() : null;
      const cEAN = prod.cEAN ? String(prod.cEAN).trim() : "";
      const cEANTrib = prod.cEANTrib ? String(prod.cEANTrib).trim() : "";

      // Regra de validação: Só aceita se tiver código de barras válido
      const isValidEan = (code: string) =>
        code && code.toUpperCase() !== "SEM GTIN";

      // 1. Lendo o primeiro código de barras (Normalmente a Caixa)
      if (isValidEan(cEAN)) {
        extractedProducts.set(cEAN, { descricao: xProd, ncm });
      }

      // 2. Lendo o segundo código de barras (Unidade).
      // Se for diferente do primeiro, ele cria um novo registro independente!
      if (isValidEan(cEANTrib) && cEANTrib !== cEAN) {
        extractedProducts.set(cEANTrib, { descricao: xProd, ncm });
      }
    }

    const codigosParaProcessar = Array.from(extractedProducts.keys());
    if (codigosParaProcessar.length === 0) {
      return NextResponse.json(
        { error: "Nenhum código de barras válido na nota" },
        { status: 400 },
      );
    }

    // Busca no banco quem já existe
    const produtosExistentes = await prisma.produtoGlobal.findMany({
      where: { codigo_barras: { in: codigosParaProcessar } },
      select: { codigo_barras: true, id: true },
    });

    const mapaExistentes = new Map<string, number>(
      produtosExistentes.map((p: { codigo_barras: string; id: number }) => [
        p.codigo_barras,
        p.id,
      ]),
    );

    // MOLDES PARA O TYPESCRIPT E ESLINT FICAREM FELIZES
    type ProdutoXMLNovo = {
      codigo_barras: string;
      descricao: string;
      ncm: string | null;
      origem_dado: "XML";
      status_auditoria: "PENDENTE";
    };

    type ProdutoXMLAtualizacao = {
      id: number;
      data: { ncm: string | null };
    };

    const novos: ProdutoXMLNovo[] = [];
    const paraAtualizar: ProdutoXMLAtualizacao[] = [];

    // Separa as ações (Insert vs Update)
    for (const [ean, dados] of extractedProducts.entries()) {
      const existingId = mapaExistentes.get(ean);

      if (typeof existingId === "number") {
        // Se já existe, atualiza APENAS o NCM com a informação oficial da nota
        paraAtualizar.push({
          id: existingId,
          data: { ncm: dados.ncm },
        });
      } else {
        // Se é novo, cria do zero
        novos.push({
          codigo_barras: ean,
          descricao: dados.descricao,
          ncm: dados.ncm,
          origem_dado: "XML",
          status_auditoria: "PENDENTE",
        });
      }
    }

    // Executa no banco de forma segura
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
    console.error("Erro na importação de XML:", error);
    return NextResponse.json(
      { error: "Falha ao processar o arquivo XML" },
      { status: 500 },
    );
  }
}
