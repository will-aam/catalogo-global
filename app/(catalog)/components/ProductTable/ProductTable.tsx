"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";
import { useRouter } from "next/navigation";
import NCMReplaceModal from "../NCMReplace/NCMReplaceModal";
import type { BulkPayload } from "@/app/(catalog)/types";

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
  const [bulkSubcategoria, setBulkSubcategoria] = useState("");
  const [bulkMarca, setBulkMarca] = useState("");
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
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

  const handleExport = (format: "csv" | "xlsx", exportAllBase: boolean) => {
    const params = new URLSearchParams();
    params.set("format", format);

    if (!exportAllBase) {
      if (categoriaFiltro) params.set("categoriaFiltro", categoriaFiltro);
      if (termoBusca) params.set("termoBusca", termoBusca);
    }

    window.location.href = `/api/products/export?${params.toString()}`;
  };

  const handleBulkDelete = async () => {
    const count = selectAllPages ? totalItemsEncontrados : selectedIds.size;
    const confirmMessage = `Tem certeza que deseja EXCLUIR ${count} produto(s)? Esta ação não pode ser desfeita.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeletingBulk(true);
    try {
      const payload: Omit<BulkPayload, "categoria" | "marca"> = {};

      if (selectAllPages) {
        payload.selectAllFilters = {
          categoriaFiltro: categoriaFiltro || null,
          termoBusca: termoBusca || null,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        setSelectAllPages(false);
        router.refresh();
        alert("Produtos excluídos com sucesso!");
      } else {
        alert("Erro ao excluir. Verifique a conexão.");
      }
    } catch {
      alert("Erro ao processar a exclusão em lote");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory && !bulkMarca && !bulkSubcategoria) {
      return alert(
        "Digite uma Categoria, Marca ou Subcategoria para atualizar!",
      );
    }

    setIsSavingBulk(true);
    try {
      const payload: BulkPayload = {};

      if (bulkCategory) payload.categoria = bulkCategory;
      if (bulkMarca) payload.marca = bulkMarca;
      if (bulkSubcategoria) payload.subcategoria = bulkSubcategoria;

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
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Barra de Ações em Lote */}
      <div className="bg-blue-600 text-white p-3 flex flex-col xl:flex-row items-center justify-between sticky top-0 z-20 shadow-md border-b border-blue-700 gap-3 shrink-0">
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
                  className="text-xs text-blue-200 hover:text-white underline mt-1 font-medium text-left"
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

        <div className="flex gap-2 flex-wrap justify-end items-center">
          <button
            onClick={() => setIsReplaceModalOpen(true)}
            className="bg-zinc-600 hover:bg-neutral-950 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            Substituir NCM
          </button>

          {/* MENU DROPDOWN DE EXPORTAÇÃO */}
          <div className="relative inline-block text-left group">
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Exportar
            </button>
            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block hover:block z-30 divide-y divide-gray-100">
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Filtros Atuais da Tela
                </div>
                <button
                  onClick={() => handleExport("csv", false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  📄 Baixar em CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx", false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  📊 Baixar em Excel (.xlsx)
                </button>
              </div>
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Banco Completo
                </div>
                <button
                  onClick={() => handleExport("csv", true)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  📄 Baixar Base Inteira (CSV)
                </button>
                <button
                  onClick={() => handleExport("xlsx", true)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  📊 Baixar Base Inteira (XLSX)
                </button>
              </div>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={isDeletingBulk || isSavingBulk}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50 ml-2"
              >
                {isDeletingBulk ? "Excluindo..." : "Excluir Selecionados"}
              </button>

              <div className="h-6 w-px bg-blue-400 mx-2"></div>

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
              <input
                type="text"
                placeholder="Nova Subcategoria"
                value={bulkSubcategoria}
                onChange={(e) => setBulkSubcategoria(e.target.value)}
                className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-36"
              />
              <button
                onClick={handleBulkUpdate}
                disabled={isSavingBulk || isDeletingBulk}
                className="bg-green-500 hover:bg-green-400 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSavingBulk ? "..." : "Aplicar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-auto flex-1 min-h-0">
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
              <th className="p-4 font-semibold w-40 bg-gray-100">
                Subcategoria
              </th>
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

      <NCMReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
      />
    </div>
  );
}
