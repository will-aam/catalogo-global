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
        body: JSON.stringify({
          ...editData,
          status_auditoria: "REVISADO",
        }),
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
        <td className="p-4 text-center">
          {/* CORREÇÃO AQUI: Avisamos o React que ele continua controlado, mesmo desabilitado */}
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            disabled
            className="w-4 h-4 cursor-not-allowed opacity-50 accent-blue-600"
          />
        </td>
        <td className="p-2">
          {/* CORREÇÃO AQUI: Adicionado || "" como trava de segurança em todos */}
          <input
            className="w-full p-1 border rounded text-xs font-mono outline-none focus:border-blue-400"
            value={editData.codigo_barras || ""}
            onChange={(e) =>
              setEditData({ ...editData, codigo_barras: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs font-medium outline-none focus:border-blue-400"
            value={editData.descricao || ""}
            onChange={(e) =>
              setEditData({ ...editData, descricao: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs outline-none focus:border-blue-400"
            value={editData.ncm || ""}
            onChange={(e) => setEditData({ ...editData, ncm: e.target.value })}
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs outline-none focus:border-blue-400"
            value={editData.marca || ""}
            onChange={(e) =>
              setEditData({ ...editData, marca: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs outline-none focus:border-blue-400"
            value={editData.categoria || ""}
            onChange={(e) =>
              setEditData({ ...editData, categoria: e.target.value })
            }
          />
        </td>
        <td className="p-2 text-center" colSpan={2}>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs hover:bg-green-200 transition-colors"
            >
              {isLoading ? "..." : "✓ SALVAR"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold text-xs hover:bg-gray-200 transition-colors"
            >
              ✕ CANCELAR
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors border-b ${isSelected ? "bg-blue-50/30" : ""}`}
    >
      <td className="p-4 text-center">
        <input
          type="checkbox"
          className="w-4 h-4 cursor-pointer accent-blue-600"
          checked={isSelected}
          onChange={() => onToggle(produto.id)}
        />
      </td>
      <td className="p-4 font-mono text-gray-900 font-medium">
        {editData.codigo_barras}
      </td>
      <td
        className="p-4 font-medium text-gray-700 truncate"
        title={editData.descricao}
      >
        {editData.descricao}
      </td>
      <td className="p-4 text-gray-500 truncate">{editData.ncm || "-"}</td>
      <td className="p-4 text-gray-600 truncate">{editData.marca || "-"}</td>
      <td className="p-4 truncate">
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border">
          {editData.categoria || "Sem Categoria"}
        </span>
      </td>
      <td className="p-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            editData.status_auditoria === "PENDENTE"
              ? "bg-yellow-100 text-yellow-700"
              : editData.status_auditoria === "REVISADO"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {editData.status_auditoria}
        </span>
      </td>
      <td className="p-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsEditing(true)}
            className="text-lg hover:scale-110 transition-transform grayscale hover:grayscale-0"
            title="Editar Produto"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-lg hover:scale-110 transition-transform grayscale hover:grayscale-0"
            title="Excluir Produto"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}
