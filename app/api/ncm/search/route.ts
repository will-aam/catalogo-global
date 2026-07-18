import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 50);

  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await prisma.$queryRaw<
      Array<{ codigo: string; descricao: string; score: number }>
    >`
      SELECT codigo, descricao, similarity(descricao, ${q}) AS score
      FROM tabela_ncm
      WHERE descricao % ${q}
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ results });
  } catch (error) {
    console.error("NCM search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
