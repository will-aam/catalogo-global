// app/api/products/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { StatusAuditoria } from "@prisma/client";
import * as XLSX from "xlsx";
import { formatNcm, cleanNcm } from "@/lib/ncm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaFiltro = searchParams.get("categoriaFiltro");
    const marcaFiltro = searchParams.get("marcaFiltro");
    const subcategoriaFiltro = searchParams.get("subcategoriaFiltro");
    const semNcm = searchParams.get("semNcm") === "true";
    const ncmIncorreto = searchParams.get("ncmIncorreto") === "true";
    const termoBusca = searchParams.get("termoBusca");
    const statusFiltro = searchParams.get("statusFiltro");
    const format = searchParams.get("format") || "csv"; // csv ou xlsx
    const ncmFormat = searchParams.get("ncmFormat") || "pontos"; // pontos ou sem_pontos (ERP)

    let whereClause: Prisma.ProdutoGlobalWhereInput = {};
    const conditions: Prisma.ProdutoGlobalWhereInput[] = [];

    // Aplica os filtros dinamicamente se existirem na URL
    if (categoriaFiltro === "SEM_CATEGORIA") {
      conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
    } else if (categoriaFiltro) {
      conditions.push({ categoria: categoriaFiltro });
    }

    if (marcaFiltro) conditions.push({ marca: marcaFiltro });
    if (subcategoriaFiltro) {
      conditions.push({ subcategoria: subcategoriaFiltro });
    }
    if (semNcm) conditions.push({ OR: [{ ncm: null }, { ncm: "" }] });

    if (ncmIncorreto) {
      const invalidIdsResult = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM "produtos_globais"
        WHERE "ncm" IS NOT NULL AND "ncm" != '' AND "ncm" !~ '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
      `;
      const invalidIds = invalidIdsResult.map((r) => r.id);
      conditions.push({ id: { in: invalidIds.length > 0 ? invalidIds : [-1] } });
    }

    if (termoBusca) {
      conditions.push({
        OR: [
          { descricao: { contains: termoBusca, mode: "insensitive" } },
          { codigo_barras: { contains: termoBusca } },
        ],
      });
    }

    if (Object.values(StatusAuditoria).includes(statusFiltro as StatusAuditoria)) {
      conditions.push({ status_auditoria: statusFiltro as StatusAuditoria });
    }

    if (conditions.length > 0) {
      whereClause = { AND: conditions };
    }

    // Busca todos os produtos correspondentes (sem paginação para exportar o bloco inteiro)
    const produtos = await prisma.produtoGlobal.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
    });

    // Mapeamento com opção de NCM com pontos (padrão) ou sem pontos (para sistemas ERP)
    const data = produtos.map((p) => {
      let ncmFormatado = "";
      if (p.ncm) {
        ncmFormatado = ncmFormat === "sem_pontos"
          ? (cleanNcm(p.ncm) || "")
          : (formatNcm(p.ncm) || "");
      }

      return {
        ID: p.id,
        "Código de Barras": p.codigo_barras || "",
        Descrição: p.descricao || "",
        NCM: ncmFormatado,
        Marca: p.marca || "",
        Categoria: p.categoria || "Sem Categoria",
        Status: p.status_auditoria,
      };
    });

    const fileSuffix = ncmFormat === "sem_pontos" ? "_erp" : "";

    // ---- EXPORTAÇÃO EM EXCEL (.XLSX) ----
    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Trava de segurança Excel: força tipo String em Código de Barras (coluna B / c: 1)
      // e em NCM (coluna D / c: 3) para preservar zeros à esquerda
      if (worksheet["!ref"]) {
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let r = range.s.r + 1; r <= range.e.r; ++r) {
          const cellBarcode = worksheet[XLSX.utils.encode_cell({ r, c: 1 })];
          if (cellBarcode && cellBarcode.v !== undefined) {
            cellBarcode.t = "s";
            cellBarcode.v = String(cellBarcode.v);
          }
          const cellNcm = worksheet[XLSX.utils.encode_cell({ r, c: 3 })];
          if (cellNcm && cellNcm.v !== undefined) {
            cellNcm.t = "s";
            cellNcm.v = String(cellNcm.v);
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
          "Content-Disposition": `attachment; filename="catalogo_produtos${fileSuffix}.xlsx"`,
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
        item["Código de Barras"] ? `="${item["Código de Barras"]}"` : '""',
        `"${item.Descrição.replace(/"/g, '""')}"`,
        item.NCM ? `="${item.NCM}"` : '""',
        `"${item.Marca.replace(/"/g, '""')}"`,
        `"${item.Categoria.replace(/"/g, '""')}"`,
        `"${item.Status}"`,
      ]);

      // Separador por ponto e vírgula (;) padrão do Excel em Português (Brasil)
      const csvContent = [
        headers.join(";"),
        ...rows.map((r) => r.join(";")),
      ].join("\n");

      const bom = Buffer.from("\uFEFF", "utf-8");
      const csvBuffer = Buffer.concat([bom, Buffer.from(csvContent, "utf-8")]);

      return new NextResponse(csvBuffer, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="catalogo_produtos${fileSuffix}.csv"`,
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
