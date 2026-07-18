"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoriaCount } from "@/app/(catalog)/types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCat, setCopiedCat] = useState<string | null>(null); // Estado para o feedback de cópia

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

  const handleCopy = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedCat(texto);
    // Remove o ícone de sucesso após 2 segundos
    setTimeout(() => setCopiedCat(null), 2000);
  };

  const categoriasExibidas = categorias.filter((cat) => {
    const nomeParaBusca = cat.categoria || "Sem Categoria";
    return nomeParaBusca.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full md:w-64 bg-white border border-slate-300 rounded-xl shadow-md flex flex-col shrink-0 overflow-hidden h-fit max-h-[calc(100vh-10rem)]">
      {/* CABEÇALHO FIXO */}
      <div className="p-4 bg-slate-100 border-b border-slate-300 flex justify-between items-center z-10 sticky top-0">
        <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Categorias
        </h2>
      </div>

      {/* BARRA DE PESQUISA FIXA */}
      <div className="p-3 border-b border-slate-200 bg-white z-10 sticky top-15">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Filtrar lista..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-500 placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA COM ROLAGEM */}
      <div className="p-2 overflow-y-auto flex-1">
        <div
          className={`flex items-center mb-2 rounded-lg transition-all border-2 ${
            !categoriaAtual
              ? "bg-blue-100 border-blue-400 shadow-sm"
              : "bg-transparent border-transparent hover:bg-slate-100"
          }`}
        >
          <button
            onClick={() => handleFilter(null)}
            className={`w-full text-left px-3 py-2.5 text-sm font-extrabold ${
              !categoriaAtual ? "text-blue-900" : "text-slate-800"
            }`}
          >
            Todas as Categorias
          </button>
        </div>

        {categoriasExibidas.map((cat, index) => {
          const isSemCategoria = !cat.categoria || cat.categoria.trim() === "";
          const nomeExibicao = isSemCategoria
            ? "Sem Categoria"
            : cat.categoria || "";
          const identificador = isSemCategoria
            ? "SEM_CATEGORIA"
            : cat.categoria!;
          const isActive = categoriaAtual === identificador;
          const isCurrentlyRenaming =
            isRenaming !== null && isRenaming === identificador;
          const isCopied = copiedCat === identificador;

          return (
            <div key={index} className="mb-1.5">
              {isCurrentlyRenaming ? (
                <div className="flex items-center gap-1 p-1.5 w-full bg-blue-50 border-2 border-blue-500 rounded-lg shadow-sm z-20">
                  <input
                    className="flex-1 min-w-0 bg-white border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-bold text-slate-900"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleBulkRename(identificador)
                    }
                  />
                  <button
                    onClick={() => handleBulkRename(identificador)}
                    className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded transition-colors shadow-sm shrink-0"
                    title="Salvar (Enter)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsRenaming(null)}
                    className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded transition-colors shadow-sm shrink-0"
                    title="Cancelar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  className={`group flex items-center justify-between gap-1 rounded-lg border-2 transition-all ${
                    isActive
                      ? "bg-blue-100 border-blue-400 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Área Clicável para Filtrar (Responsiva com min-w-0) */}
                  <button
                    onClick={() => handleFilter(cat.categoria, isSemCategoria)}
                    className={`flex-1 flex items-center min-w-0 px-2.5 py-2 text-left text-sm ${
                      isActive
                        ? "font-extrabold text-blue-900"
                        : "font-semibold text-slate-800"
                    } ${isSemCategoria ? "italic text-slate-600" : ""}`}
                  >
                    <span className="truncate">{nomeExibicao}</span>
                  </button>

                  {/* Ações e Contador alinhados à direita (Não quebram o layout) */}
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    {!isSemCategoria && (
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {/* Botão de Copiar */}
                        <button
                          onClick={() => handleCopy(nomeExibicao)}
                          className="p-1.5 bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 rounded-md transition-all"
                          title="Copiar nome da categoria"
                        >
                          {isCopied ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-600"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
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
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                        </button>

                        {/* Botão de Renomear */}
                        <button
                          onClick={() => {
                            setIsRenaming(identificador);
                            setNewName(nomeExibicao);
                          }}
                          className="p-1.5 bg-blue-50 border border-blue-200 shadow-sm text-blue-700 hover:text-white hover:bg-blue-600 hover:border-blue-600 rounded-md transition-all"
                          title="Renomear Categoria"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Badge do Contador */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-extrabold shadow-sm ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-300 text-slate-900"
                      }`}
                    >
                      {cat._count.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {categoriasExibidas.length === 0 && (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-slate-400 mb-2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <p className="text-sm text-slate-700 font-bold">
              Nenhuma categoria encontrada.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
