import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import UploadButton from "../components/UploadButton";
import XMLUploadButton from "../components/XMLUploadButton";
import PDFUploadButton from "../components/PDFUploadButton";
import CategorySidebar from "../components/CategorySidebar";
import ProductTable from "../components/ProductTable";
import PaginationControls from "../components/PaginationControls";
import SearchBar from "../components/SearchBar";

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
        {/* HEADER RESPONSIVO COM Z-INDEX (z-50 garante que o menu fica por cima de tudo) */}
        <header className="relative z-50 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          {/* Título */}
          <div className="w-full lg:w-auto flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
                Catálogo Global
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                Gestão de Base Mestra
              </p>
            </div>

            {/* Contador Visível apenas no Mobile */}
            <div className="lg:hidden bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-center">
              <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                Itens
              </span>
              <span className="block text-sm font-black text-blue-700 leading-none mt-0.5">
                {totalItens}
              </span>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="w-full lg:flex-1 lg:max-w-3xl">
            <SearchBar />
          </div>

          {/* Status e Ações */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-3 shrink-0">
            {/* Contador Visível apenas no Desktop */}
            <div className="hidden lg:flex bg-blue-50/50 px-4 py-1.5 rounded-lg border border-blue-100 flex-col items-center mr-2">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                Encontrados
              </span>
              <span className="text-lg font-black text-blue-700 leading-none mt-0.5">
                {totalItens}
              </span>
            </div>

            {/* Dropdown de Importação Corrigido */}
            <div className="relative group w-full lg:w-auto">
              <button className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none">
                Importar Dados
                <svg
                  className="w-4 h-4 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* pt-2 (padding-top) cria a área segura invisível para o rato descer sem fechar o menu */}
              <div className="absolute right-0 top-full pt-2 w-full lg:w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {/* O cartão branco com os botões */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col p-2 gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Formatos
                  </span>
                  <UploadButton />
                  <XMLUploadButton />
                  <PDFUploadButton />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Adicionado relative e z-10 para garantir que esta secção fica por baixo do header */}
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
