import { prisma } from "../lib/prisma";

export default async function CatalogoPage() {
  // Busca todos os produtos diretamente do banco de dados (Neon)
  const produtos = await prisma.produtoGlobal.findMany({
    orderBy: { created_at: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Catálogo Global
            </h1>
            <p className="text-gray-500 mt-1">
              Gestão e auditoria de base de dados mestra
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-gray-600">
              Total de itens:{" "}
            </span>
            <span className="text-lg font-bold text-blue-600">
              {produtos.length}
            </span>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Cód. Barras</th>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">NCM</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {produtos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum produto cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  produtos.map((produto) => (
                    <tr
                      key={produto.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-gray-600">
                        {produto.codigo_barras}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {produto.descricao}
                      </td>
                      <td className="p-4 text-gray-500">
                        {produto.ncm || "-"}
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border">
                          {produto.categoria || "Sem Categoria"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            produto.status_auditoria === "PENDENTE"
                              ? "bg-yellow-100 text-yellow-700"
                              : produto.status_auditoria === "REVISADO"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {produto.status_auditoria}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
