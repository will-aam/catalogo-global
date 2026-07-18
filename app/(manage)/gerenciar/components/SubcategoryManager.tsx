"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RenameInline from "./RenameInline";
import MergeModal from "./MergeModal/MergeModal";
import type { SubcategoriaTree, ManagedItem } from "../types";

type SubcategoryManagerProps = {
  subcategoriaTree: SubcategoriaTree[];
  categorias: ManagedItem[];
};

export default function SubcategoryManager({
  subcategoriaTree,
  categorias,
}: SubcategoryManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
    return new Set(subcategoriaTree.slice(0, 3).map((c) => c.categoria));
  });
  const [mergeTarget, setMergeTarget] = useState<{
    name: string;
    categoria: string;
  } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{
    subcategoria: string;
    fromCategoria: string;
  } | null>(null);
  const [moveDestCategoria, setMoveDestCategoria] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState("");

  const toggleExpand = (categoria: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(categoria)) next.delete(categoria);
      else next.add(categoria);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCats(new Set(subcategoriaTree.map((c) => c.categoria)));
  };

  const collapseAll = () => {
    setExpandedCats(new Set());
  };

  const filteredTree = searchTerm
    ? subcategoriaTree
        .map((cat) => ({
          ...cat,
          subcategorias: cat.subcategorias.filter((sub) =>
            sub.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.subcategorias.length > 0)
    : subcategoriaTree;

  const handleMove = async () => {
    if (!moveTarget || !moveDestCategoria) return;
    if (moveDestCategoria === moveTarget.fromCategoria) {
      setMoveError("Selecione uma categoria diferente");
      return;
    }

    setIsMoving(true);
    setMoveError("");

    try {
      const res = await fetch("/api/subcategorias/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategoria: moveTarget.subcategoria,
          fromCategoria: moveTarget.fromCategoria,
          toCategoria: moveDestCategoria,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao mover");
      }

      setMoveTarget(null);
      setMoveDestCategoria("");
      router.refresh();
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : "Erro ao mover");
    } finally {
      setIsMoving(false);
    }
  };

  const getExistingSubcategorias = (excludeName?: string) => {
    const all = subcategoriaTree.flatMap((c) => c.subcategorias);
    return all
      .filter((s) => !excludeName || s.name !== excludeName)
      .map((s) => s.name);
  };

  const categoriaNames = categorias.map((c) => c.name);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Filtrar subcategorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={expandAll}
          className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          Expandir tudo
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          Recolher tudo
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {filteredTree.map((cat) => {
          const isExpanded = expandedCats.has(cat.categoria);
          return (
            <div
              key={cat.categoria}
              className="border-b border-slate-100 last:border-b-0"
            >
              <button
                onClick={() => toggleExpand(cat.categoria)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-sm font-bold text-slate-700">
                  {cat.categoria}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                  {cat.subcategorias.length}
                </span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-50">
                  {cat.subcategorias.map((sub) => (
                    <div
                      key={`${cat.categoria}-${sub.name}`}
                      className="group flex items-center justify-between px-4 py-2.5 pl-10 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-300 shrink-0"
                        >
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                        </svg>
                        <RenameInline
                          currentName={sub.name}
                          field="subcategoria"
                          onRenamed={() => router.refresh()}
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {sub.count}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              setMergeTarget({
                                name: sub.name,
                                categoria: cat.categoria,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                            title="Mesclar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M8 3H3v5" />
                              <path d="m7 8-4-4" />
                              <path d="M16 3h5v5" />
                              <path d="m17 8 4-4" />
                              <path d="M12 22v-8.3" />
                              <path d="m7 16 4 4" />
                              <path d="m17 16-4 4" />
                            </svg>
                          </button>

                          <button
                            onClick={() =>
                              setMoveTarget({
                                subcategoria: sub.name,
                                fromCategoria: cat.categoria,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all"
                            title="Mover para outra categoria"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cat.subcategorias.length === 0 && (
                    <div className="px-4 py-3 pl-10 text-xs text-slate-400 font-medium italic">
                      Nenhuma subcategoria
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredTree.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">
            Nenhuma subcategoria encontrada.
          </div>
        )}
      </div>

      {mergeTarget && (
        <MergeModal
          sourceName={mergeTarget.name}
          field="subcategoria"
          existingItems={getExistingSubcategorias(mergeTarget.name)}
          onClose={() => setMergeTarget(null)}
          onMerged={() => {
            setMergeTarget(null);
            router.refresh();
          }}
        />
      )}

      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setMoveTarget(null);
              setMoveError("");
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-linear-to-r from-green-600 to-emerald-600 p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/80"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                Mover Subcategoria
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Mover{" "}
                <span className="font-bold text-white">
                  &ldquo;{moveTarget.subcategoria}&rdquo;
                </span>{" "}
                de{" "}
                <span className="font-bold text-white">
                  &ldquo;{moveTarget.fromCategoria}&rdquo;
                </span>{" "}
                para outra categoria
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Categoria de destino
                </label>
                <select
                  value={moveDestCategoria}
                  onChange={(e) => {
                    setMoveDestCategoria(e.target.value);
                    setMoveError("");
                  }}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Selecione a categoria...</option>
                  {categoriaNames
                    .filter((c) => c !== moveTarget.fromCategoria)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>

              {moveError && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {moveError}
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMoveTarget(null);
                  setMoveError("");
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMove}
                disabled={isMoving || !moveDestCategoria}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isMoving ? (
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
                    Movendo...
                  </>
                ) : (
                  "Mover"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
