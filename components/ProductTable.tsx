"use client";

import { useState } from "react";
import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";
import { useRouter } from "next/navigation";

export default function ProductTable({
  produtos,
}: {
  produtos: ProdutoGlobal[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const router = useRouter();

  // Verifica se todos da página atual estão selecionados
  const allSelected =
    produtos.length > 0 && selectedIds.size === produtos.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set()); // Desmarca todos
    } else {
      setSelectedIds(new Set(produtos.map((p) => p.id))); // Marca todos da página
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkCategorize = async () => {
    if (!bulkCategory) return alert("Digite a nova categoria!");
    setIsSavingBulk(true);
    try {
      const res = await fetch("/api/products/bulk-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          categoria: bulkCategory,
        }),
      });
      if (res.ok) {
        setSelectedIds(new Set()); // Limpa seleção
        setBulkCategory(""); // Limpa o input
        router.refresh(); // Recarrega os dados
      }
    } catch {
      // <-- ESLint corrigido (removido o 'e')
      alert("Erro ao categorizar itens");
    } finally {
      setIsSavingBulk(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 relative">
      {/* BARRA DE AÇÃO EM LOTE (Só aparece se tiver algo selecionado) */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-600 text-white p-3 flex items-center justify-between sticky top-0 z-10 shadow-md animate-in slide-in-from-top-2">
          <span className="font-semibold text-sm">
            {selectedIds.size}{" "}
            {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite a categoria (ex: Calçados)"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="text-black px-3 py-1.5 rounded-md text-sm outline-none w-64"
            />
            <button
              onClick={handleBulkCategorize}
              disabled={isSavingBulk}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isSavingBulk ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm table-fixed min-w-250">
          {" "}
          {/* <-- Tailwind corrigido para min-w-250 */}
          <thead className="bg-gray-100 border-b text-gray-600">
            <tr>
              {/* CHECKBOX DO CABEÇALHO */}
              <th className="p-4 w-16 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                  checked={allSelected}
                  onChange={toggleAll}
                  title="Selecionar todos da página"
                />
              </th>
              <th className="p-4 font-semibold w-40">Cód. Barras</th>
              <th className="p-4 font-semibold w-auto">Descrição</th>
              <th className="p-4 font-semibold w-24">NCM</th>
              <th className="p-4 font-semibold w-32">Marca</th>
              <th className="p-4 font-semibold w-40">Categoria</th>
              <th className="p-4 font-semibold w-32">Status</th>
              <th className="p-4 font-semibold w-20 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <ProductRow
                  key={produto.id}
                  produto={produto}
                  isSelected={selectedIds.has(produto.id)}
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
