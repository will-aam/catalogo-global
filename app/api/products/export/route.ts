// app/api/products/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaFiltro = searchParams.get("categoriaFiltro");
    const termoBusca = searchParams.get("termoBusca");
    const format = searchParams.get("format") || "csv"; // csv ou xlsx

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};
    const conditions: Prisma.ProdutoGlobalWhereInput[] = [];

    // Aplica os filtros dinamicamente se existirem na URL
    if (categoriaFiltro === "SEM_CATEGORIA") {
      conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
    } else if (categoriaFiltro) {
      conditions.push({ categoria: categoriaFiltro });
    }

    if (termoBusca) {
      conditions.push({
        OR: [
          { descricao: { contains: termoBusca, mode: "insensitive" } },
          { codigo_barras: { contains: termoBusca } },
        ],
      });
    }

    if (conditions.length > 0) {
      whereClause = { AND: conditions };
    }

    // Busca todos os produtos correspondentes (sem paginação para exportar o bloco inteiro)
    const produtos = await prisma.produtoGlobal.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
    });

    // Mapeamento limpo para o arquivo
    const data = produtos.map((p) => ({
      ID: p.id,
      "Código de Barras": p.codigo_barras || "",
      Descrição: p.descricao || "",
      NCM: p.ncm || "",
      Marca: p.marca || "",
      Categoria: p.categoria || "Sem Categoria",
      Status: p.status_auditoria,
    }));

    // ---- EXPORTAÇÃO EM EXCEL (.XLSX) ----
    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);

      // TRAVA DE SEGURANÇA EXCEL: Percorre a coluna B (Código de Barras)
      // e força o tipo 's' (String/Texto) em cada célula para evitar o formato científico
      if (worksheet["!ref"]) {
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let r = range.s.r + 1; r <= range.e.r; ++r) {
          const cellAddress = XLSX.utils.encode_cell({ r, c: 1 }); // c: 1 representa a segunda coluna (Código de Barras)
          const cell = worksheet[cellAddress];
          if (cell && cell.v !== undefined) {
            cell.t = "s";
            cell.v = String(cell.v);
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="catalogo_produtos.xlsx"`,
        },
      });
    }

    // ---- EXPORTAÇÃO EM CSV ----
    else {
      const headers = [
        "ID",
        "Código de Barras",
        "Descrição",
        "NCM",
        "Marca",
        "Categoria",
        "Status",
      ];

      const rows = data.map((item) => [
        item.ID,
        `="${item["Código de Barras"]}"`, // TRUQUE DO EXCEL: Salvar como ="VALOR" impede a quebra do código de barras
        `"${item.Descrição.replace(/"/g, '""')}"`,
        `"${item.NCM}"`,
        `"${item.Marca.replace(/"/g, '""')}"`,
        `"${item.Categoria.replace(/"/g, '""')}"`,
        `"${item.Status}"`,
      ]);

      // Separador por ponto e vírgula (;) padrão do Excel em Português (Brasil)
      const csvContent = [
        headers.join(";"),
        ...rows.map((r) => r.join(";")),
      ].join("\n");

      // O caractere BOM (\uFEFF) força o Excel a abrir o CSV direto em UTF-8 mantendo os acentos perfeitamente
      const bom = Buffer.from("\uFEFF", "utf-8");
      const csvBuffer = Buffer.concat([bom, Buffer.from(csvContent, "utf-8")]);

      return new NextResponse(csvBuffer, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="catalogo_produtos.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Erro ao exportar:", error);
    return NextResponse.json(
      { error: "Erro ao processar arquivo" },
      { status: 500 },
    );
  }
}
