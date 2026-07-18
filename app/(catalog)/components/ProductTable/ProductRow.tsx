"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function ProductRow({
  produto,
  isSelected,
  onToggle,
}: {
  produto: ProdutoGlobal;
  isSelected: boolean;
  onToggle: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(produto);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${produto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      alert("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${produto.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setIsDeleted(true);
      } else {
        alert("Erro ao excluir o item.");
      }
    } catch {
      alert("Erro na conexão ao excluir.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isDeleted) return null;

  // ═══════════════════════════════════════════════════════════════
  //  MODO EDIÇÃO
  // ═══════════════════════════════════════════════════════════════
  if (isEditing) {
    return (
      <tr className="bg-blue-50/50 transition-colors">
        <td className="p-2 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            disabled
            className="w-4 h-4 cursor-not-allowed opacity-50 accent-blue-600"
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.codigo_barras || ""}
            onChange={(e) =>
              setEditData({ ...editData, codigo_barras: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.descricao || ""}
            onChange={(e) =>
              setEditData({ ...editData, descricao: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.ncm || ""}
            onChange={(e) => setEditData({ ...editData, ncm: e.target.value })}
            placeholder="33051000"
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.marca || ""}
            onChange={(e) =>
              setEditData({ ...editData, marca: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.categoria || ""}
            onChange={(e) =>
              setEditData({ ...editData, categoria: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.subcategoria || ""}
            onChange={(e) =>
              setEditData({ ...editData, subcategoria: e.target.value })
            }
          />
        </td>
        <td className="p-2 text-center">
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-100 text-green-700 px-3 py-1.5 rounded font-bold text-xs hover:bg-green-200 transition-colors shadow-sm flex items-center gap-1"
            >
              {isLoading ? "Salvando..." : "✓ Salvar"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded font-bold text-xs hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-1"
            >
              ✕ Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODO VISUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <tr
        className={`hover:bg-gray-50 transition-colors border-b ${
          isSelected ? "bg-blue-50/30" : ""
        }`}
      >
        <td className="p-2 sm:p-4 text-center whitespace-nowrap">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer accent-blue-600"
            checked={isSelected}
            onChange={() => onToggle(produto.id)}
          />
        </td>

        <td className="p-2 sm:p-4 font-mono font-medium whitespace-nowrap">
          {produto.codigo_barras ? (
            <a
              href={`https://www.google.com/search?q=${produto.codigo_barras}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-colors w-max"
              title="Pesquisar código no Google"
            >
              {produto.codigo_barras}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>

        <td
          className="p-2 sm:p-4 font-medium text-gray-700 truncate max-w-50 sm:max-w-75"
          title={produto.descricao}
        >
          {produto.descricao}
        </td>

        <td
          className="p-2 sm:p-4 text-gray-500 font-mono text-xs truncate max-w-25 whitespace-nowrap"
          title={produto.ncm || undefined}
        >
          {produto.ncm || "-"}
        </td>

        <td
          className="p-2 sm:p-4 text-gray-600 truncate max-w-30"
          title={produto.marca || undefined}
        >
          {produto.marca || "-"}
        </td>

        <td className="p-2 sm:p-4 truncate max-w-37.5">
          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border truncate inline-block max-w-full">
            {produto.categoria || "Sem Categoria"}
          </span>
        </td>

        <td className="p-2 sm:p-4 truncate max-w-37.5">
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border truncate inline-block max-w-full">
            {produto.subcategoria || "—"}
          </span>
        </td>

        <td className="p-2 sm:p-4 whitespace-nowrap">
          <div className="flex justify-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar Produto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Excluir Produto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {showDeleteModal && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => !isLoading && setShowDeleteModal(false)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-linear-to-r from-red-500 to-red-600 p-5 text-center">
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
                  <h3 className="text-lg font-bold text-white">
                    Excluir Produto
                  </h3>
                </div>
                <div className="p-5 text-center space-y-3">
                  <p className="text-sm text-slate-600 font-medium">
                    Tem certeza que deseja excluir este item?
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Item
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {produto.descricao || "Sem descrição"}
                    </p>
                    {produto.codigo_barras && (
                      <p className="text-xs text-slate-500 font-mono">
                        {produto.codigo_barras}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-red-500 font-semibold">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <div className="px-5 pb-5 flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
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
          </td>
        </tr>
      )}
    </>
  );
}
