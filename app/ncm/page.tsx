import { prisma } from "@/lib/prisma";
import NcmClient from "./NcmClient";

export const metadata = {
  title: "Tabela NCM - Catálogo Global",
};

export default async function NcmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 50;

  const where = q
    ? {
        OR: [
          { codigo: { contains: q, mode: "insensitive" as const } },
          { descricao: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.nCM.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { codigo: "asc" },
    }),
    prisma.nCM.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <NcmClient
      items={items}
      total={total}
      page={page}
      totalPages={totalPages}
      q={q}
    />
  );
}
