"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CategoriaCount = {
  categoria: string | null;
  _count: { id: number };
};

export default function CategorySidebar({
  categorias,
}: {
  categorias: CategoriaCount[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaAtual = searchParams.get("categoria");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleFilter = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!cat) params.delete("categoria");
    else params.set("categoria", cat);
    params.set("page", "1"); // Sempre volta para a página 1 ao filtrar
    router.push(`/?${params.toString()}`);
  };

  const handleBulkRename = async (oldName: string | null) => {
    if (!newName || !oldName) return;
    const res = await fetch("/api/categories/bulk-rename", {
      method: "POST",
      body: JSON.stringify({ oldName, newName }),
    });
    if (res.ok) {
      setIsRenaming(null);
      router.refresh();
    }
  };

  return (
    <aside className="w-full md:w-64 bg-white border rounded-xl shadow-sm flex flex-col shrink-0">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="font-semibold text-gray-800">Categorias</h2>
      </div>
      <div className="p-2 overflow-y-auto max-h-[70vh]">
        <button
          onClick={() => handleFilter(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
            !categoriaAtual
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Todas as Categorias
        </button>

        {categorias.map((cat, index) => {
          const nome = cat.categoria || "Sem Categoria";
          const isActive = categoriaAtual === cat.categoria;

          return (
            <div key={index} className="group flex items-center gap-1 mb-1">
              {isRenaming === cat.categoria ? (
                <div className="flex gap-1 p-1 w-full">
                  <input
                    className="border rounded px-1 text-xs w-full"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <button
                    onClick={() => handleBulkRename(cat.categoria)}
                    className="text-green-600 text-xs"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleFilter(cat.categoria)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {nome} ({cat._count.id})
                  </button>
                  <button
                    onClick={() => {
                      setIsRenaming(cat.categoria);
                      setNewName(nome);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 text-xs"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
