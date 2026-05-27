import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import UploadButton from "../components/UploadButton";
import XMLUploadButton from "../components/XMLUploadButton";
import CategorySidebar from "../components/CategorySidebar";
import ProductTable from "../components/ProductTable";
import PaginationControls from "../components/PaginationControls";
import SearchBar from "../components/SearchBar";
import ScrollToButtons from "../components/ScrollToButtons";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; page?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const categoriaFiltro = resolvedParams.categoria;
  const termoBusca = resolvedParams.q;
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

  const [categoriasResumo, totalItens, produtos] = await Promise.all([
    prisma.produtoGlobal.groupBy({
      by: ["categoria"],
      _count: { id: true },
      orderBy: { categoria: "asc" },
    }),
    prisma.produtoGlobal.count({ where }),
    prisma.produtoGlobal.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalItens / pageSize);

  return (
    <main className="min-h-screen bg-slate-100 p-4 relative">
      {/* Container expandido focado em Desktop */}
      <div className="max-w-[98vw] mx-auto flex flex-col gap-4">
        {/* CABEÇALHO */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-6">
          <div className="shrink-0">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
              Catálogo Global
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
              Gestão de Base Mestra
            </p>
          </div>

          <div className="flex-1 max-w-3xl">
            <SearchBar />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-50/50 px-4 py-1.5 rounded-lg border border-blue-100 flex flex-col items-center mr-2">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                Encontrados
              </span>
              <span className="text-lg font-black text-blue-700 leading-none mt-0.5">
                {totalItens}
              </span>
            </div>

            <UploadButton />
            <XMLUploadButton />
          </div>
        </header>

        {/* ÁREA PRINCIPAL */}
        <div className="flex gap-4 items-start">
          <aside className="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 sticky top-4">
            <CategorySidebar categorias={categoriasResumo} />
          </aside>

          <section className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* NOVO: Barra superior da tabela com paginação no topo */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center px-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Navegação Superior
              </span>
              <PaginationControls currentPage={page} totalPages={totalPages} />
            </div>

            <ProductTable
              produtos={produtos}
              totalItemsEncontrados={totalItens}
              categoriaFiltro={categoriaFiltro}
              termoBusca={termoBusca}
            />

            {/* Barra inferior tradicional com paginação na base */}
            <div className="bg-slate-50 border-t border-slate-200 p-2">
              <PaginationControls currentPage={page} totalPages={totalPages} />
            </div>
          </section>
        </div>
      </div>

      {/* Componente flutuante de saltos de página (Topo/Fim) */}
      <ScrollToButtons />
    </main>
  );
}
