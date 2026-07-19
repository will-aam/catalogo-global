import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  if (!type || !q || q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    // 1. Busca de NCM (Autocompletar pelo código numérico)
    if (type === "ncm") {
      const results = await prisma.$queryRaw<
        Array<{ codigo: string; descricao: string }>
      >`
        SELECT codigo, descricao 
        FROM tabela_ncm
        WHERE codigo LIKE ${q + "%"}
        LIMIT 15
      `;
      return NextResponse.json(results);
    }

    // 2. Busca Dinâmica nas outras colunas
    const validFields = ["marca", "categoria", "subcategoria"];
    if (!validFields.includes(type)) return NextResponse.json([]);

    // Tipagem correta para satisfazer o Prisma e o TypeScript
    const validField = type as "marca" | "categoria" | "subcategoria";

    // Busca os valores distintos já cadastrados no banco
    const results = await prisma.produtoGlobal.findMany({
      where: {
        [validField]: {
          contains: q,
          mode: "insensitive", // Ignora maiúsculas/minúsculas
        },
        NOT: {
          [validField]: null,
        },
      },
      distinct: [validField],
      select: {
        [validField]: true,
      },
      take: 10,
    });

    // Mapeia usando um Record ao invés de 'any'
    const mapped = results
      .map((r: Record<string, string | null>) => r[validField])
      .filter((val) => val && val.trim() !== "");

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erro na busca de sugestões:", error);
    return NextResponse.json([]);
  }
}
