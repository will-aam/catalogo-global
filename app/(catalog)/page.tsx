import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import CatalogHeader from "./components/CatalogHeader";
import CategorySidebar from "./components/CategorySidebar";
import ProductTable from "./components/ProductTable/ProductTable";
import PaginationControls from "./components/PaginationControls";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    page?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const categoriaFiltro = resolvedParams.categoria;
  const termoBusca = resolvedParams.q;
  const sortParam = resolvedParams.sort;
  const page = parseInt(resolvedParams.page || "1");
  const pageSize = 200;

  const conditions: Prisma.ProdutoGlobalWhereInput[] = [];

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

  const where: Prisma.ProdutoGlobalWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const orderByQuery: Prisma.ProdutoGlobalOrderByWithRelationInput =
    sortParam === "asc"
      ? { codigo_barras: "asc" }
      : sortParam === "desc"
        ? { codigo_barras: "desc" }
        : { created_at: "desc" };

  const [categoriasResumo, totalItens, produtos] = await Promise.all([
    prisma.produtoGlobal.groupBy({
      by: ["categoria"],
      _count: { id: true },
      orderBy: { categoria: "asc" },
    }),
    prisma.produtoGlobal.count({ where }),
    prisma.produtoGlobal.findMany({
      where,
      orderBy: orderByQuery,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalItens / pageSize);

  return (
    <main className="min-h-screen bg-slate-100 p-4 relative">
      <div className="max-w-[98vw] mx-auto flex flex-col gap-4">
        <CatalogHeader totalItens={totalItens} />

        <div className="flex flex-col md:flex-row gap-4 items-start relative z-10">
          <aside className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 md:sticky md:top-4">
            <CategorySidebar categorias={categoriasResumo} />
          </aside>

          <section className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-col sm:flex-row justify-between items-center px-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
                Navegação Superior
              </span>
              <PaginationControls currentPage={page} totalPages={totalPages} />
            </div>

            <ProductTable
              produtos={produtos}
              totalItemsEncontrados={totalItens}
              categoriaFiltro={categoriaFiltro}
              termoBusca={termoBusca}
              currentSort={sortParam}
            />

            <div className="bg-slate-50 border-t border-slate-200 p-2 flex justify-center sm:justify-end">
              <PaginationControls currentPage={page} totalPages={totalPages} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
