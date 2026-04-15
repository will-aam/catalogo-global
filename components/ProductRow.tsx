"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client"; // Tipo oficial do Prisma

export default function ProductRow({ produto }: { produto: ProdutoGlobal }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(produto);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${produto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          status_auditoria: "REVISADO", // Ao salvar, já marca como revisado
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        // O ideal aqui seria um toast de sucesso
      }
      // ... código anterior
    } catch (error) {
      console.error("Erro no formulário ao salvar:", error); // <-- Adicionamos isso!
      alert("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };
  // ... resto do código

  if (isEditing) {
    return (
      <tr className="bg-blue-50/50 transition-colors">
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs font-mono"
            value={editData.codigo_barras}
            onChange={(e) =>
              setEditData({ ...editData, codigo_barras: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs font-medium"
            value={editData.descricao}
            onChange={(e) =>
              setEditData({
                ...editData,
                descricao: e.target.value.toUpperCase(),
              })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs"
            value={editData.ncm || ""}
            onChange={(e) => setEditData({ ...editData, ncm: e.target.value })}
          />
        </td>
        <td className="p-2">
          <input
            className="w-full p-1 border rounded text-xs"
            value={editData.categoria || ""}
            onChange={(e) =>
              setEditData({ ...editData, categoria: e.target.value })
            }
          />
        </td>
        <td className="p-2 text-center">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="text-green-600 font-bold text-xs hover:underline mr-2"
          >
            {isLoading ? "..." : "SALVAR"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-400 text-xs hover:underline"
          >
            CANCELAR
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b">
      <td className="p-4 font-mono text-gray-600 truncate">
        {editData.codigo_barras}
      </td>
      <td
        className="p-4 font-medium text-gray-900 truncate"
        title={editData.descricao}
      >
        {editData.descricao}
      </td>
      <td className="p-4 text-gray-500 truncate">{editData.ncm || "-"}</td>
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
      <td className="p-4 text-center">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}
