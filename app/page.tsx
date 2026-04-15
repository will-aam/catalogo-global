import { prisma } from "../lib/prisma";
import UploadButton from "../components/UploadButton";
import CategorySidebar from "../components/CategorySidebar";
import ProductTable from "../components/ProductTable";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  // 1. Busca um resumo das categorias e a contagem de quantos itens tem em cada uma
  const categoriasResumo = await prisma.produtoGlobal.groupBy({
    by: ["categoria"],
    _count: { id: true },
    orderBy: { categoria: "asc" },
  });

  // 2. Busca os produtos (com limite de 200 para não travar o navegador)
  // e filtra pela categoria caso o usuário tenha clicado na Sidebar
  const produtos = await prisma.produtoGlobal.findMany({
    where: searchParams.categoria
      ? { categoria: searchParams.categoria }
      : undefined,
    orderBy: { created_at: "desc" },
    take: 200, // Limite vital para a saúde da aba do navegador!
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-350 mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Catálogo Global
            </h1>
            <p className="text-gray-500 mt-1">
              Gestão e auditoria de base de dados mestra
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <UploadButton />
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
              <span className="text-sm font-medium text-gray-600">
                Visualizando:{" "}
              </span>
              <span className="text-lg font-bold text-blue-600">
                {produtos.length}{" "}
                {searchParams.categoria ? "nesta categoria" : "recentes"}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Principal (Sidebar Lateral + Tabela) */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* A Sidebar fica na esquerda */}
          <div className="w-full md:w-auto shrink-0">
            <CategorySidebar categorias={categoriasResumo} />
          </div>

          {/* A Tabela ocupa o resto do espaço */}
          <ProductTable produtos={produtos} />
        </div>
      </div>
    </main>
  );
}
