import { prisma } from "../lib/prisma";
import UploadButton from "../components/UploadButton";
import CategorySidebar from "../components/CategorySidebar";
import ProductTable from "../components/ProductTable";
import PaginationControls from "../components/PaginationControls";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const categoriaFiltro = resolvedParams.categoria;
  const page = parseInt(resolvedParams.page || "1");
  const pageSize = 200;

  // Lógica inteligente para buscar os "Sem Categoria"
  let where = {};
  if (categoriaFiltro === "SEM_CATEGORIA") {
    where = {
      OR: [{ categoria: null }, { categoria: "" }],
    };
  } else if (categoriaFiltro) {
    where = { categoria: categoriaFiltro };
  }

  // Busca paralela para performance
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Catálogo Global</h1>
            <p className="text-gray-500">Mostrando {totalItens} produtos</p>
          </div>
          <UploadButton />
        </div>

        <div className="flex gap-6 items-start">
          <CategorySidebar categorias={categoriasResumo} />

          <div className="flex-1 flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden">
            <ProductTable produtos={produtos} />
            <PaginationControls currentPage={page} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </main>
  );
}
