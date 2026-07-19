// app/(catalog)/components/ProductTable/ProductRow.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ProdutoGlobal } from "@prisma/client";
import { useRouter } from "next/navigation";

type NcmResult = { codigo: string; descricao: string; score: number };

// ─── COMPONENTE REUTILIZÁVEL DE AUTOCOMPLETE ──────────────────
function AutocompleteInput({
  value,
  onChange,
  type,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  type: "marca" | "categoria" | "subcategoria" | "ncm";
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<string | { codigo: string; descricao: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = async (term: string) => {
    if (term.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/suggestions?type=${type}&q=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className={className}
      />

      {/* Dropdown de Sugestões */}
      {isOpen && (
        <ul className="absolute z-10005 w-64 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl text-xs divide-y divide-gray-50">
          {loading && <li className="p-2 text-gray-400">Buscando...</li>}
          {!loading &&
            suggestions.map((item, i) => {
              // Trata NCM (Objeto) vs Marcas/Categorias (String)
              const isObj = typeof item === "object";
              const displayText = isObj
                ? `${item.codigo} - ${item.descricao}`
                : item;
              const valueToSave = isObj ? item.codigo : item;

              return (
                <li
                  key={i}
                  // onMouseDown previne que o onBlur do input feche o menu antes do clique registrar
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(valueToSave);
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-gray-700 truncate"
                  title={displayText}
                >
                  {isObj ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-bold text-blue-700">
                        {item.codigo}
                      </span>
                      <span className="text-gray-500 line-clamp-1">
                        {item.descricao}
                      </span>
                    </div>
                  ) : (
                    item
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

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

  // ─── NCM FUZZY SEARCH ────────────────────────────────────────
  const [ncmSearchOpen, setNcmSearchOpen] = useState(false);
  const [ncmSearchTerm, setNcmSearchTerm] = useState("");
  const [ncmResults, setNcmResults] = useState<NcmResult[]>([]);
  const [ncmSearchLoading, setNcmSearchLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ncmSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── GTIN API SEARCH ────────────────────────────────────────
  const [gtinLoading, setGtinLoading] = useState(false);

  const handleGtinSearch = async () => {
    const ean = editData.codigo_barras?.replace(/\D/g, "");

    if (!ean || ean.length < 8) {
      alert("Digite um código de barras (EAN/GTIN) válido para buscar.");
      return;
    }

    setGtinLoading(true);
    try {
      const res = await fetch(`/api/ncm/gtin/${ean}`);

      if (res.status === 404) {
        alert("Produto não encontrado na base de dados global.");
        return;
      }

      if (!res.ok) throw new Error("Erro ao buscar o GTIN");

      const data = await res.json();

      setEditData((prev) => ({
        ...prev,
        ncm: data.ncm ? data.ncm.replace(/\D/g, "") : prev.ncm,
        descricao: data.nome || prev.descricao,
        marca: data.marca || prev.marca,
        categoria: data.categoria || prev.categoria,
      }));
    } catch {
      alert("Erro de conexão ao consultar o Código de Barras.");
    } finally {
      setGtinLoading(false);
    }
  };

  // Fecha dropdown ao clicar fora ou Escape
  useEffect(() => {
    if (!ncmSearchOpen) return;
    const handleClick = (e: MouseEvent) => {
      const dd = document.getElementById("ncm-search-dropdown");
      const btn = document.getElementById("ncm-search-btn");
      if (
        dd &&
        !dd.contains(e.target as Node) &&
        btn &&
        !btn.contains(e.target as Node)
      ) {
        setNcmSearchOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNcmSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [ncmSearchOpen]);

  const searchNcm = async (term: string) => {
    if (term.trim().length < 3) {
      setNcmResults([]);
      return;
    }
    setNcmSearchLoading(true);
    try {
      const res = await fetch(
        `/api/ncm/search?q=${encodeURIComponent(term)}&limit=12`,
      );
      const data = await res.json();
      setNcmResults(data.results || []);
    } catch {
      setNcmResults([]);
    } finally {
      setNcmSearchLoading(false);
    }
  };

  const openNcmSearch = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ddWidth = 420;
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - ddWidth - 8),
    );
    setDropdownPos({ top: rect.bottom + 4, left });
    setNcmSearchOpen(true);
    const initial = editData.descricao || "";
    setNcmSearchTerm(initial);
    if (initial.trim().length >= 3) {
      searchNcm(initial);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setNcmSearchTerm(value);
    if (ncmSearchTimer.current) clearTimeout(ncmSearchTimer.current);
    ncmSearchTimer.current = setTimeout(() => searchNcm(value), 300);
  };

  const selectNcm = (codigo: string) => {
    setEditData({ ...editData, ncm: codigo.replace(/\D/g, "") });
    setNcmSearchOpen(false);
    setNcmResults([]);
  };

  // ─── SALVAR ─────────────────────────────────────────────────
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

  // ─── EXCLUIR ────────────────────────────────────────────────
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
      <>
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

          {/* CÓDIGO DE BARRAS COM BUSCA GTIN */}
          <td className="p-2">
            <div className="flex items-center gap-1">
              <input
                className="w-full p-1.5 border rounded text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={editData.codigo_barras || ""}
                onChange={(e) =>
                  setEditData({ ...editData, codigo_barras: e.target.value })
                }
              />
              <button
                type="button"
                onClick={handleGtinSearch}
                disabled={gtinLoading}
                className="shrink-0 p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50"
                title="Preencher dados usando o Código de Barras"
              >
                {gtinLoading ? (
                  <svg
                    className="animate-spin h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
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
                    <path d="M3 5v14" />
                    <path d="M8 5v14" />
                    <path d="M12 5v14" />
                    <path d="M17 5v14" />
                    <path d="M21 5v14" />
                  </svg>
                )}
              </button>
            </div>
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

          {/* NCM COM AUTOSUGGEST + LUPA (BUSCA FUZZY) */}
          <td className="p-2">
            <div className="flex items-center gap-1">
              <AutocompleteInput
                type="ncm"
                className="w-full p-1.5 border rounded text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={editData.ncm || ""}
                onChange={(val) =>
                  setEditData({ ...editData, ncm: val.replace(/\D/g, "") })
                }
                placeholder="33051000"
              />
              <button
                id="ncm-search-btn"
                type="button"
                onClick={openNcmSearch}
                className="shrink-0 p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
                title="Buscar NCM pela descrição do produto"
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
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </td>

          {/* MARCA COM AUTOSUGGEST */}
          <td className="p-2">
            <AutocompleteInput
              type="marca"
              className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={editData.marca || ""}
              onChange={(val) => setEditData({ ...editData, marca: val })}
            />
          </td>

          {/* CATEGORIA COM AUTOSUGGEST */}
          <td className="p-2">
            <AutocompleteInput
              type="categoria"
              className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={editData.categoria || ""}
              onChange={(val) => setEditData({ ...editData, categoria: val })}
            />
          </td>

          {/* SUBCATEGORIA COM AUTOSUGGEST */}
          <td className="p-2">
            <AutocompleteInput
              type="subcategoria"
              className="w-full p-1.5 border rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={editData.subcategoria || ""}
              onChange={(val) =>
                setEditData({ ...editData, subcategoria: val })
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

        {/* DROPDOWN DE BUSCA NCM (FUZZY POR DESCRIÇÃO) */}
        {ncmSearchOpen && (
          <tr>
            <td colSpan={8} className="p-0">
              <div
                id="ncm-search-dropdown"
                className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: 420,
                  zIndex: 10001,
                }}
              >
                {/* Input de busca */}
                <div className="p-2.5 border-b border-gray-100 bg-slate-50/80">
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      autoFocus
                      value={ncmSearchTerm}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setNcmSearchOpen(false);
                      }}
                      placeholder="Buscar por descrição do NCM..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Resultados */}
                <div className="max-h-60 overflow-auto">
                  {ncmSearchLoading && ncmResults.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs">
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Buscando NCMs...
                    </div>
                  ) : ncmResults.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      {ncmSearchTerm.length < 3
                        ? "Digite ao menos 3 caracteres"
                        : "Nenhum NCM encontrado"}
                    </div>
                  ) : (
                    ncmResults.map((item, i) => (
                      <button
                        key={`${item.codigo}-${i}`}
                        type="button"
                        onClick={() => selectNcm(item.codigo)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] font-bold text-blue-700 shrink-0 mt-px bg-blue-50 px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                          <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {item.descricao}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-1.5 border-t border-gray-100 bg-slate-50/80">
                  <p className="text-[10px] text-gray-400">
                    {ncmResults.length} resultado(s) — busca fuzzy pela
                    descrição
                  </p>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
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
          className="p-2 sm:p-4 text-gray-500 font-mono text-sm truncate max-w-36 whitespace-nowrap"
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

      {/* MODAL DE EXCLUSÃO */}
      {showDeleteModal && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
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
