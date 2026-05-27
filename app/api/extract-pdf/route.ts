import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Ficheiro não encontrado" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pdf = await getDocumentProxy(uint8Array);
    const { text } = await extractText(pdf);

    const textoCompleto = Array.isArray(text) ? text.join("\n") : String(text);

    // Limpeza Absoluta: aspas e vírgulas viram espaços para não colar as palavras
    const lines = textoCompleto
      .split("\n")
      .map((l: string) =>
        l.replace(/["']/g, "").replace(/,/g, " ").replace(/\s+/g, " ").trim(),
      )
      .filter((l: string) => l.length > 0);

    type ProdutoExtraido = {
      codigo_barras: string;
      descricao: string;
      ncm: string;
      marca: string;
    };

    const extracted: ProdutoExtraido[] = [];

    // 🧠 DETEÇÃO AUTOMÁTICA DE LAYOUT
    const textoUpper = textoCompleto.toUpperCase();
    const isMarsLayout =
      textoUpper.includes("NCM") &&
      (textoUpper.includes("DUN") ||
        textoUpper.includes("MATERIAL") ||
        textoUpper.includes("SKU"));

    if (isMarsLayout) {
      // --- MOTOR 2: CATÁLOGO MARS (TABELA 360º) ---
      const ncmRegex = /\b(\d{4}\.\d{2}\.\d{2}(?:\.\d{2})?)\b/;

      for (let i = 0; i < lines.length; i++) {
        const ncmMatch = lines[i].match(ncmRegex);

        if (ncmMatch) {
          const ncm = ncmMatch[1].replace(/\./g, "");
          let descricao = "SEM DESCRIÇÃO";
          let dun = "";
          let ean = "";

          const tempLine = lines[i];

          // BÚSSOLA HORIZONTAL: Tenta achar os códigos gigantes na mesma linha
          const dunMatch = tempLine.match(/\b\d{14}\b/);
          if (dunMatch) dun = dunMatch[0];
          const eanMatch = tempLine.match(/\b\d{13}\b/);
          if (eanMatch) ean = eanMatch[0];

          // BÚSSOLA DE DESCRIÇÃO: Avalia se a linha é longa (formato perfeito)
          if (tempLine.length > 30) {
            const idx = ncmMatch.index || 0;
            let textBeforeNcm = tempLine.substring(0, idx);
            // Remove números isolados (como IDs internos) para limpar a descrição
            textBeforeNcm = textBeforeNcm
              .replace(/\b\d+\b/g, "")
              .replace(/\s+/g, " ")
              .trim();
            if (textBeforeNcm.length > 5) {
              descricao = textBeforeNcm;
            }
          } else {
            // BÚSSOLA VERTICAL (Para Cima): Se o PDF estiver com colunas quebradas
            for (let up = 1; up <= 4; up++) {
              if (i - up >= 0) {
                const prevLine = lines[i - up];
                if (prevLine.length >= 6 && /[A-Za-z]/.test(prevLine)) {
                  descricao = prevLine;
                  break;
                }
              }
            }
          }

          // BÚSSOLA VERTICAL (Para Baixo): Se não achou os códigos EAN/DUN na linha
          if (!dun || !ean) {
            for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
              // Cortamos os espaços e analisamos palavra por palavra para não colar dados
              const words = lines[j].split(" ");
              for (const w of words) {
                const cleanCode = w.replace(/\D/g, "");
                if (cleanCode.length === 14 && !dun) dun = cleanCode;
                if (cleanCode.length === 13 && !ean) ean = cleanCode;
              }
            }
          }

          // A Mágica da Duplicação Inteligente
          if (dun)
            extracted.push({ codigo_barras: dun, descricao, ncm, marca: "" });
          if (ean && ean !== dun)
            extracted.push({ codigo_barras: ean, descricao, ncm, marca: "" });
        }
      }
    } else {
      // --- MOTOR 1: CATÁLOGO ASA BRANCA (LISTA SIMPLES) ---
      const eanRegex = /^\d{13,14}$/;
      for (let i = 0; i < lines.length; i++) {
        if (eanRegex.test(lines[i])) {
          const ean = lines[i];
          let descricao = "";

          if (i >= 2) {
            const linha1 = lines[i - 2];
            const linha2 = lines[i - 1];
            descricao = `${linha1} ${linha2}`.trim();
          } else if (i >= 1) {
            descricao = lines[i - 1];
          }

          extracted.push({
            codigo_barras: ean,
            descricao: descricao || "SEM DESCRIÇÃO",
            ncm: "",
            marca: "",
          });
        }
      }
    }

    // Filtro contra duplicação de códigos idênticos no mesmo PDF
    const produtosUnicos: ProdutoExtraido[] = [];
    const codigosVistos = new Set<string>();

    for (const item of extracted) {
      if (!codigosVistos.has(item.codigo_barras)) {
        codigosVistos.add(item.codigo_barras);
        produtosUnicos.push(item);
      }
    }

    return NextResponse.json({
      sucesso: true,
      totalEncontrado: produtosUnicos.length,
      produtos: produtosUnicos,
    });
  } catch (error) {
    console.error("Erro ao extrair PDF:", error);
    return NextResponse.json(
      { error: "Falha ao processar o ficheiro PDF" },
      { status: 500 },
    );
  }
}
