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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Estado da barra de pesquisa

  const handleFilter = (
    cat: string | null,
    isSemCategoria: boolean = false,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (isSemCategoria) {
      params.set("categoria", "SEM_CATEGORIA");
    } else if (!cat) {
      params.delete("categoria");
    } else {
      params.set("categoria", cat);
    }

    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const handleBulkRename = async (oldNameId: string) => {
    if (!newName || !oldNameId) return;
    const res = await fetch("/api/categories/bulk-rename", {
      method: "POST",
      body: JSON.stringify({ oldName: oldNameId, newName }),
    });
    if (res.ok) {
      setIsRenaming(null);
      router.refresh();
    }
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="bg-white border p-2 rounded-lg shadow-sm hover:bg-gray-50 flex flex-col items-center gap-2"
        title="Abrir Categorias"
      >
        <span className="[writing-mode:vertical-lr] font-bold text-gray-500 text-xs tracking-widest">
          CATEGORIAS
        </span>
      </button>
    );
  }

  // Filtra as categorias baseado na barra de pesquisa (ignora maiúscula/minúscula)
  const categoriasExibidas = categorias.filter((cat) => {
    const nomeParaBusca = cat.categoria || "Sem Categoria";
    return nomeParaBusca.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full md:w-64 bg-white border rounded-xl shadow-sm flex flex-col shrink-0">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Categorias</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          Recolher
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Pesquisar categoria..."
          className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="p-2 overflow-y-auto max-h-[60vh]">
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

        {categoriasExibidas.map((cat, index) => {
          const isSemCategoria = !cat.categoria || cat.categoria.trim() === "";
          const nomeExibicao = isSemCategoria
            ? "Sem Categoria"
            : cat.categoria || "";
          const identificador = isSemCategoria
            ? "SEM_CATEGORIA"
            : cat.categoria!;
          const isActive = categoriaAtual === identificador;

          // Agora compara usando o identificador seguro, evitando o bug do null === null
          const isCurrentlyRenaming =
            isRenaming !== null && isRenaming === identificador;

          return (
            <div key={index} className="group flex items-center gap-1 mb-1">
              {isCurrentlyRenaming ? (
                <div className="flex gap-1 p-1 w-full">
                  <input
                    className="border rounded px-2 py-1 text-xs w-full outline-none focus:border-blue-400"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)} // MAIÚSCULA OBRIGATÓRIA REMOVIDA
                    autoFocus
                  />
                  <button
                    onClick={() => handleBulkRename(identificador)}
                    className="text-green-600 text-xs font-bold px-1"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setIsRenaming(null)}
                    className="text-red-500 text-xs font-bold px-1"
                  >
                    X
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleFilter(cat.categoria, isSemCategoria)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {nomeExibicao} ({cat._count.id})
                  </button>
                  <button
                    onClick={() => {
                      setIsRenaming(identificador);
                      setNewName(nomeExibicao);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 text-xs"
                    title="Renomear Categoria"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          );
        })}

        {categoriasExibidas.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-4">
            Nenhuma categoria encontrada.
          </p>
        )}
      </div>
    </aside>
  );
}
