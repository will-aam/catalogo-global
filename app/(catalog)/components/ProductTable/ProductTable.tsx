// app/(catalog)/components/ProductTable/ProductTable.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";
import AIAuditAssistant from "./AIAuditAssistant";
import { useRouter } from "next/navigation";
import NCMReplaceModal from "../NCMReplace/NCMReplaceModal";
import type { BulkPayload } from "@/app/(catalog)/types";

type FeedbackType = "success" | "error";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
} | null;

export default function ProductTable({
  produtos,
  totalItemsEncontrados,
  categoriaFiltro,
  marcaFiltro,
  subcategoriaFiltro,
  semNcm,
  termoBusca,
  currentSort,
  statusFiltro,
}: {
  produtos: ProdutoGlobal[];
  totalItemsEncontrados: number;
  categoriaFiltro?: string;
  marcaFiltro?: string;
  subcategoriaFiltro?: string;
  semNcm?: boolean;
  termoBusca?: string;
  currentSort?: string;
  statusFiltro?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubcategoria, setBulkSubcategoria] = useState("");
  const [bulkMarca, setBulkMarca] = useState("");
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [bulkNcm, setBulkNcm] = useState("");
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !exportMenuRef.current?.contains(event.target)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportMenuOpen(false);
        exportButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExportMenuOpen]);

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ type, title, message });
  };

  const isProductSelected = (id: number) =>
    selectAllPages ? !excludedIds.has(id) : selectedIds.has(id);
  const allOnPageSelected =
    produtos.length > 0 && produtos.every((produto) => isProductSelected(produto.id));
  const someOnPageSelected =
    !allOnPageSelected && produtos.some((produto) => isProductSelected(produto.id));
  const selectedProducts = produtos.filter((produto) => isProductSelected(produto.id));
  const selectionCount = selectAllPages
    ? Math.max(0, totalItemsEncontrados - excludedIds.size)
    : selectedIds.size;
  const hasSelection = selectionCount > 0;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  const toggleAll = () => {
    setShowBulkEditor(false);
    if (allOnPageSelected) {
      if (selectAllPages) {
        setExcludedIds((current) => new Set([...current, ...produtos.map((product) => product.id)]));
      } else {
        setSelectedIds(new Set());
        setShowBulkEditor(false);
      }
    } else {
      if (selectAllPages) {
        setExcludedIds((current) => {
          const next = new Set(current);
          produtos.forEach((product) => next.delete(product.id));
          return next;
        });
      } else {
        setSelectedIds(new Set(produtos.map((product) => product.id)));
      }
    }
  };

  const toggleOne = (id: number) => {
    setShowBulkEditor(false);
    if (selectAllPages) {
      setExcludedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearReviewedProduct = (id: number) => {
    if (selectAllPages) {
      setExcludedIds((current) => new Set(current).add(id));
    } else {
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const handleExport = (format: "csv" | "xlsx", exportAllBase: boolean) => {
    const params = new URLSearchParams();
    params.set("format", format);
    setIsExportMenuOpen(false);

    if (!exportAllBase) {
      if (categoriaFiltro) params.set("categoriaFiltro", categoriaFiltro);
      if (marcaFiltro) params.set("marcaFiltro", marcaFiltro);
      if (subcategoriaFiltro) params.set("subcategoriaFiltro", subcategoriaFiltro);
      if (semNcm) params.set("semNcm", "true");
      if (termoBusca) params.set("termoBusca", termoBusca);
      if (statusFiltro) params.set("statusFiltro", statusFiltro);
    }

    window.location.href = `/api/products/export?${params.toString()}`;
  };

  const handleBulkDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeletingBulk(true);
    try {
      const payload: Omit<BulkPayload, "categoria" | "marca"> = {};

      if (selectAllPages) {
        payload.selectAllFilters = {
          categoriaFiltro: categoriaFiltro || null,
          termoBusca: termoBusca || null,
          statusFiltro: statusFiltro || null,
          marcaFiltro: marcaFiltro || null,
          subcategoriaFiltro: subcategoriaFiltro || null,
          semNcm: Boolean(semNcm),
          excludeIds: Array.from(excludedIds),
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
        setExcludedIds(new Set());
        setShowBulkEditor(false);
        router.refresh();
        showFeedback(
          "success",
          "Exclusão Concluída",
          "Produtos excluídos com sucesso!",
        );
      } else {
        showFeedback(
          "error",
          "Erro ao Excluir",
          "Não foi possível excluir. Verifique a conexão.",
        );
      }
    } catch {
      showFeedback(
        "error",
        "Erro ao Excluir",
        "Ocorreu um erro ao processar a exclusão em lote.",
      );
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory && !bulkMarca && !bulkSubcategoria && !bulkNcm) {
      return alert(
        "Digite uma Categoria, Marca, Subcategoria ou NCM para atualizar!",
      );
    }

    setIsSavingBulk(true);
    try {
      const payload: BulkPayload = {};

      if (bulkCategory) payload.categoria = bulkCategory;
      if (bulkMarca) payload.marca = bulkMarca;
      if (bulkSubcategoria) payload.subcategoria = bulkSubcategoria;

      if (bulkNcm) payload.ncm = bulkNcm.replace(/\D/g, "");

      if (selectAllPages) {
        payload.selectAllFilters = {
          categoriaFiltro: categoriaFiltro || null,
          termoBusca: termoBusca || null,
          statusFiltro: statusFiltro || null,
          marcaFiltro: marcaFiltro || null,
          subcategoriaFiltro: subcategoriaFiltro || null,
          semNcm: Boolean(semNcm),
          excludeIds: Array.from(excludedIds),
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
        setExcludedIds(new Set());
        setBulkCategory("");
        setBulkMarca("");
        setBulkSubcategoria("");
        setBulkNcm("");
        setShowBulkEditor(false);
        router.refresh();
        showFeedback(
          "success",
          "Atualização Concluída",
          "Produtos atualizados com sucesso!",
        );
      } else {
        showFeedback(
          "error",
          "Erro ao Atualizar",
          "Não foi possível atualizar. Verifique a conexão.",
        );
      }
    } catch {
      showFeedback(
        "error",
        "Erro ao Atualizar",
        "Ocorreu um erro ao processar a requisição em lote.",
      );
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

  const deleteCount = selectionCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Barra de Ações em Lote */}
      <div className="shrink-0 border-b border-blue-100 bg-blue-50/60 p-3">
        <div className="flex flex-col items-start justify-between gap-3 xl:flex-row xl:items-center">
        {hasSelection ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
              {selectAllPages ? (
                `${selectionCount.toLocaleString("pt-BR")} produtos selecionados`
              ) : (
                `${selectionCount} ${selectionCount === 1 ? "produto selecionado" : "produtos selecionados"}`
              )}
            </span>
            {allOnPageSelected &&
              !selectAllPages &&
              totalItemsEncontrados > produtos.length && (
                <button
                  type="button"
                  onClick={() => {
                    setExcludedIds(new Set());
                    setSelectAllPages(true);
                  }}
                  className="text-xs font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                >
                  Selecionar todos os {totalItemsEncontrados.toLocaleString("pt-BR")} resultados
                </button>
              )}
            <button
              ref={exportButtonRef}
              type="button"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectAllPages(false);
                setExcludedIds(new Set());
                setShowBulkEditor(false);
              }}
              className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Limpar seleção
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-bold text-slate-800">Ferramentas da tabela</h2>
            <p className="text-xs text-slate-500">Revise, substitua NCM ou exporte produtos.</p>
          </div>
        )}

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <AIAuditAssistant
            selectedProducts={selectedProducts}
            onProductReviewed={clearReviewedProduct}
          />
          <button
            type="button"
            onClick={() => setIsReplaceModalOpen(true)}
            className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Substituir NCM
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              aria-expanded={isExportMenuOpen}
              aria-haspopup="dialog"
              aria-controls="product-export-menu"
              onClick={() => setIsExportMenuOpen((open) => !open)}
              className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
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
              <span aria-hidden="true" className="text-xs text-slate-400">▾</span>
            </button>

            {isExportMenuOpen && (
              <div
                id="product-export-menu"
                role="dialog"
                aria-label="Opções de exportação"
                className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-bold text-slate-800">Exportar resultado</p>
                  <p className="text-[11px] text-slate-500">Os filtros atuais serão aplicados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport("csv", false)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  CSV <span className="text-xs text-slate-500">— planilha compatível</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("xlsx", false)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Excel (.xlsx)
                </button>
                <div className="border-t border-slate-100 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500">Banco completo</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport("csv", true)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Base inteira (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("xlsx", true)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Base inteira (Excel)
                </button>
              </div>
            )}
          </div>

          {hasSelection && (
            <>
              <button
                type="button"
                aria-expanded={showBulkEditor}
                onClick={() => setShowBulkEditor((open) => !open)}
                className="min-h-9 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {showBulkEditor ? "Fechar edição em lote" : "Editar em lote"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeletingBulk || isSavingBulk}
                className="min-h-9 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
              >
                {isDeletingBulk ? "Excluindo…" : "Excluir selecionados"}
              </button>
            </>
          )}
        </div>

        {hasSelection && showBulkEditor && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3 sm:p-4">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-800">Edição em lote</h3>
              <p className="text-xs text-slate-500">
                Preencha apenas os campos que deseja aplicar aos produtos selecionados.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-1 text-xs font-semibold text-slate-600">
                <span className="block">Marca</span>
                <input aria-label="Nova marca" type="text" placeholder="Manter atual" value={bulkMarca} onChange={(e) => setBulkMarca(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600">
                <span className="block">Categoria</span>
                <input aria-label="Nova categoria" type="text" placeholder="Manter atual" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600">
                <span className="block">Subcategoria</span>
                <input aria-label="Nova subcategoria" type="text" placeholder="Manter atual" value={bulkSubcategoria} onChange={(e) => setBulkSubcategoria(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600">
                <span className="block">NCM</span>
                <input aria-label="Novo NCM" type="text" inputMode="numeric" placeholder="Manter atual" value={bulkNcm} onChange={(e) => setBulkNcm(e.target.value.replace(/\D/g, ""))} maxLength={8} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => { setBulkMarca(""); setBulkCategory(""); setBulkSubcategoria(""); setBulkNcm(""); setShowBulkEditor(false); }} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="button" onClick={handleBulkUpdate} disabled={isSavingBulk || isDeletingBulk} className="min-h-10 flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50">
                  {isSavingBulk ? "Aplicando…" : "Aplicar alterações"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2 text-[11px] text-slate-500 xl:hidden">
        <span>Role a tabela para ver todas as colunas</span>
        <span aria-hidden="true" className="text-sm">↔</span>
      </div>
      <div className="overflow-auto flex-1 min-h-0">
        <table className="relative w-full min-w-250 table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-blue-200 bg-blue-50 text-slate-700 shadow-sm">
            <tr>
              <th scope="col" className="w-16 bg-blue-50 p-4 text-center">
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  aria-label="Alternar seleção de todos os produtos desta página"
                  title="Alternar seleção de todos os produtos desta página"
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                />
              </th>
              <th
                scope="col"
                aria-sort={currentSort === "asc" ? "ascending" : currentSort === "desc" ? "descending" : "none"}
                className="w-40 bg-blue-50 p-0 font-semibold"
              >
                <button
                  type="button"
                  onClick={handleSortByBarcode}
                  aria-label={`Ordenar por código de barras${currentSort === "asc" ? ", crescente" : currentSort === "desc" ? ", decrescente" : ""}`}
                  className="flex min-h-12 w-full items-center gap-1 px-4 py-3 text-left transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                >
                  Cód. Barras
                  <span aria-hidden="true" className="text-lg font-bold text-slate-400">
                    {currentSort === "asc" ? "↑" : currentSort === "desc" ? "↓" : "↕"}
                  </span>
                </button>
              </th>
              <th scope="col" className="w-auto bg-blue-50 p-4 font-semibold">
                Descrição
              </th>
              <th scope="col" className="w-36 bg-blue-50 p-4 font-semibold">NCM</th>
              <th scope="col" className="w-32 bg-blue-50 p-4 font-semibold">Marca</th>
              <th scope="col" className="w-40 bg-blue-50 p-4 font-semibold">Categoria</th>
              <th scope="col" className="w-40 bg-blue-50 p-4 font-semibold">
                Subcategoria
              </th>
              <th scope="col" className="w-20 bg-blue-50 p-4 text-center font-semibold">
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
                  isSelected={isProductSelected(produto.id)}
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM LOTE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-linear-to-r from-red-500 to-red-600 p-5 text-center relative">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-3 right-3 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Excluir Produtos</h3>
            </div>

            <div className="p-5 text-center space-y-3">
              <p className="text-sm text-slate-600 font-medium">
                Tem certeza que deseja excluir{" "}
                <span className="font-bold text-slate-800">{deleteCount}</span>{" "}
                produto(s)?
              </p>
              <p className="text-xs text-red-500 font-semibold">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingBulk}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingBulk ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  "Sim, Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FEEDBACK (substitui alert()) — só fecha pelo X ou botão OK */}
      {feedback && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-5 text-center relative ${
                feedback.type === "success"
                  ? "bg-linear-to-r from-green-500 to-green-600"
                  : "bg-linear-to-r from-red-500 to-red-600"
              }`}
            >
              <button
                onClick={() => setFeedback(null)}
                className="absolute top-3 right-3 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                {feedback.type === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{feedback.title}</h3>
            </div>

            <div className="p-5 text-center">
              <p className="text-sm text-slate-600 font-medium whitespace-pre-line">
                {feedback.message}
              </p>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setFeedback(null)}
                className={`w-full px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${
                  feedback.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
