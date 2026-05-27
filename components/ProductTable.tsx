"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";
import { useRouter } from "next/navigation";

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
}: {
  produtos: ProdutoGlobal[];
  totalItemsEncontrados: number;
  categoriaFiltro?: string;
  termoBusca?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkMarca, setBulkMarca] = useState("");
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [selectAllPages, setSelectAllPages] = useState(false);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 relative flex flex-col">
      {selectedIds.size > 0 && (
        <div className="bg-blue-600 text-white p-3 flex flex-col xl:flex-row items-center justify-between sticky top-0 z-20 shadow-md animate-in slide-in-from-top-2 gap-3 border-b border-blue-700">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {selectAllPages ? (
                <>
                  Todos os{" "}
                  <span className="font-bold underline">
                    {totalItemsEncontrados}
                  </span>{" "}
                  itens correspondentes selecionados.
                </>
              ) : (
                <>
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1
                    ? "item selecionado"
                    : "itens selecionados"}
                </>
              )}
            </span>

            {allOnPageSelected &&
              !selectAllPages &&
              totalItemsEncontrados > produtos.length && (
                <button
                  onClick={() => setSelectAllPages(true)}
                  className="text-xs text-blue-200 hover:text-white text-left underline mt-1 font-medium transition-colors"
                >
                  Selecionar todos os {totalItemsEncontrados} itens
                  correspondentes à sua pesquisa?
                </button>
              )}
            {selectAllPages && (
              <button
                onClick={() => setSelectAllPages(false)}
                className="text-xs text-blue-200 hover:text-white text-left underline mt-1 transition-colors"
              >
                Desfazer seleção total
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <input
              type="text"
              placeholder="Nova Marca"
              value={bulkMarca}
              onChange={(e) => setBulkMarca(e.target.value)}
              className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-40 placeholder:text-slate-400"
            />
            <input
              type="text"
              placeholder="Nova Categoria"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-48 placeholder:text-slate-400"
            />
            <button
              onClick={handleBulkUpdate}
              disabled={isSavingBulk}
              className="bg-green-500 hover:bg-green-400 text-white px-5 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSavingBulk ? "Salvando..." : "Aplicar"}
            </button>
          </div>
        </div>
      )}

      {/* Container com scroll interno para permitir o cabeçalho fixo no estilo Excel */}
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
                  title="Selecionar todos da página"
                />
              </th>
              <th className="p-4 font-semibold w-40 bg-gray-100">
                Cód. Barras
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
    </div>
  );
}
