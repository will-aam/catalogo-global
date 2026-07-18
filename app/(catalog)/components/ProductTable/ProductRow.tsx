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
    const confirmado = window.confirm(
      "Deseja realmente confirmar a exclusão do item?",
    );

    if (confirmado) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${produto.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setIsDeleted(true);
        } else {
          alert("Erro ao excluir o item.");
          setIsLoading(false);
        }
      } catch {
        alert("Erro na conexão ao excluir.");
        setIsLoading(false);
      }
    }
  };

  if (isDeleted) return null;

  if (isEditing) {
    return (
      <tr className="bg-blue-50/50 transition-colors">
        <td className="p-2 sm:p-4 text-center">
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
            className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={editData.ncm || ""}
            onChange={(e) => setEditData({ ...editData, ncm: e.target.value })}
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

  return (
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
        {editData.codigo_barras ? (
          <a
            href={`https://www.google.com/search?q=${editData.codigo_barras}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-colors w-max"
            title="Pesquisar código no Google"
          >
            {editData.codigo_barras}
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
        title={editData.descricao}
      >
        {editData.descricao}
      </td>

      <td className="p-2 sm:p-4 text-gray-500 truncate max-w-25 whitespace-nowrap">
        {editData.ncm || "-"}
      </td>

      <td className="p-2 sm:p-4 text-gray-600 truncate max-w-30">
        {editData.marca || "-"}
      </td>

      <td className="p-2 sm:p-4 truncate max-w-37.5">
        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border truncate inline-block max-w-full">
          {editData.categoria || "Sem Categoria"}
        </span>
      </td>

      <td className="p-2 sm:p-4 truncate max-w-37.5">
        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border truncate inline-block max-w-full">
          {editData.subcategoria || "—"}
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
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
  );
}
