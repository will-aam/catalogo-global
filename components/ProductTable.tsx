"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";
import { useRouter } from "next/navigation";
import NCMReplaceModal from "./NCMReplaceModal";

type BulkPayload = {
  categoria?: string;
  marca?: string;
  ids?: number[];
  selectAllFilters?: {
    categoriaFiltro: string | null;
    termoBusca: string | null;
  };
};

export default function ProductTable({
  produtos,
  totalItemsEncontrados,
  categoriaFiltro,
  termoBusca,
  currentSort,
}: {
  produtos: ProdutoGlobal[];
  totalItemsEncontrados: number;
  categoriaFiltro?: string;
  termoBusca?: string;
  currentSort?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkMarca, setBulkMarca] = useState("");
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false); // Estado do Modal NCM
  const router = useRouter();

  const allOnPageSelected =
    produtos.length > 0 && selectedIds.size === produtos.length;

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
      setSelectAllPages(false);
    } else {
      setSelectedIds(new Set(produtos.map((p) => p.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    setSelectAllPages(false);
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory && !bulkMarca) {
      return alert("Digite uma Categoria ou uma Marca para atualizar!");
    }

    setIsSavingBulk(true);
    try {
      const payload: BulkPayload = {};

      if (bulkCategory) payload.categoria = bulkCategory;
      if (bulkMarca) payload.marca = bulkMarca;

      if (selectAllPages) {
        payload.selectAllFilters = {
          categoriaFiltro: categoriaFiltro || null,
          termoBusca: termoBusca || null,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await fetch("/api/products/bulk-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        setSelectAllPages(false);
        setBulkCategory("");
        setBulkMarca("");
        router.refresh();
      } else {
        alert("Erro ao atualizar. Verifique a conexão.");
      }
    } catch {
      alert("Erro ao processar a requisição em lote");
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleSortByBarcode = () => {
    const params = new URLSearchParams(window.location.search);
    if (currentSort === "asc") {
      params.set("sort", "desc");
    } else {
      params.set("sort", "asc");
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 relative flex flex-col">
      {/* Barra de Ações em Lote */}
      <div className="bg-blue-600 text-white p-3 flex flex-col xl:flex-row items-center justify-between sticky top-0 z-20 shadow-md border-b border-blue-700 gap-3">
        {selectedIds.size > 0 ? (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {selectAllPages ? (
                <>
                  Todos os{" "}
                  <span className="font-bold underline">
                    {totalItemsEncontrados}
                  </span>{" "}
                  itens.
                </>
              ) : (
                <>{selectedIds.size} itens selecionados</>
              )}
            </span>
            {allOnPageSelected &&
              !selectAllPages &&
              totalItemsEncontrados > produtos.length && (
                <button
                  onClick={() => setSelectAllPages(true)}
                  className="text-xs text-blue-200 hover:text-white underline mt-1 font-medium"
                >
                  Selecionar todos os {totalItemsEncontrados}?
                </button>
              )}
          </div>
        ) : (
          <div className="text-sm font-bold opacity-80">
            Ferramentas de Auditoria
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Botão de Substituir NCM global */}
          <button
            onClick={() => setIsReplaceModalOpen(true)}
            className="bg-zinc-600 hover:bg-neutral-950 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            Substituir NCM
          </button>

          {/* Inputs de edição em lote (só aparecem se houver seleção) */}
          {selectedIds.size > 0 && (
            <>
              <input
                type="text"
                placeholder="Nova Marca"
                value={bulkMarca}
                onChange={(e) => setBulkMarca(e.target.value)}
                className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-32"
              />
              <input
                type="text"
                placeholder="Nova Categoria"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-32"
              />
              <button
                onClick={handleBulkUpdate}
                disabled={isSavingBulk}
                className="bg-green-500 hover:bg-green-400 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm"
              >
                {isSavingBulk ? "..." : "Aplicar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-auto max-h-[75vh]">
        <table className="w-full text-left text-sm table-fixed min-w-250 relative">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 w-16 text-center bg-gray-100">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                />
              </th>
              <th
                className="p-4 font-semibold w-40 bg-gray-100 cursor-pointer hover:bg-slate-200 transition-colors group"
                onClick={handleSortByBarcode}
              >
                <div className="flex items-center gap-1">
                  Cód. Barras
                  <span className="text-slate-400 font-bold text-lg">
                    {currentSort === "asc"
                      ? "↑"
                      : currentSort === "desc"
                        ? "↓"
                        : "↕"}
                  </span>
                </div>
              </th>
              <th className="p-4 font-semibold w-auto bg-gray-100">
                Descrição
              </th>
              <th className="p-4 font-semibold w-24 bg-gray-100">NCM</th>
              <th className="p-4 font-semibold w-32 bg-gray-100">Marca</th>
              <th className="p-4 font-semibold w-40 bg-gray-100">Categoria</th>
              <th className="p-4 font-semibold w-32 bg-gray-100">Status</th>
              <th className="p-4 font-semibold w-20 text-center bg-gray-100">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtos.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-gray-500 bg-white"
                >
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <ProductRow
                  key={produto.id}
                  produto={produto}
                  isSelected={selectAllPages || selectedIds.has(produto.id)}
                  onToggle={toggleOne}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal fora da tabela */}
      <NCMReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
      />
    </div>
  );
}
