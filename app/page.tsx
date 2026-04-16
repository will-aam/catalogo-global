import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import UploadButton from "../components/UploadButton";
import CategorySidebar from "../components/CategorySidebar";
import ProductTable from "../components/ProductTable";
import PaginationControls from "../components/PaginationControls";
import FixColumnsButton from "../components/FixColumnsButton";
import SearchBar from "../components/SearchBar";

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
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-350 mx-auto">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Catálogo Global
              </h1>
              <p className="text-gray-500 mt-1">
                Gestão e auditoria de base de dados mestra
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <FixColumnsButton />
              <UploadButton />
              <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex gap-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 block">
                    Total Encontrado
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalItens}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center">
            <SearchBar />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-auto shrink-0">
            <CategorySidebar categorias={categoriasResumo} />
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* AQUI ESTÁ A MÁGICA: Passando as props novas para a tabela */}
            <ProductTable
              produtos={produtos}
              totalItemsEncontrados={totalItens}
              categoriaFiltro={categoriaFiltro}
              termoBusca={termoBusca}
            />
            <PaginationControls currentPage={page} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </main>
  );
}
