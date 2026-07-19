"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FilterOption = {
  value: string;
  label: string;
  count: number;
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string | null) => void;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex flex-col min-w-37.5 flex-1 transition-opacity ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-37.5 bg-position-[right_10px_center] bg-no-repeat pr-8 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <option value="">
          {disabled ? "Selecione uma categoria..." : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.count})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CatalogFilters({
  categorias,
  marcas,
  subcategorias,
}: {
  categorias: FilterOption[];
  marcas: FilterOption[];
  subcategorias: FilterOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const currentCategoria = searchParams.get("categoria") || "";
  const currentMarca = searchParams.get("marca") || "";
  const currentSubcategoria = searchParams.get("subcategoria") || "";
  const semNcm = searchParams.get("semNcm") === "true";

  const hasCategoria = !!currentCategoria;

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const handleCategoriaChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("categoria", value);
    } else {
      params.delete("categoria");
    }
    params.delete("subcategoria");
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", searchTerm.trim() || null);
  };

  const toggleSemNcm = () => {
    setParam("semNcm", semNcm ? null : "true");
  };

  const clearAll = () => router.push("/");

  const activeFilters: { key: string; label: string }[] = [];

  if (searchParams.get("q"))
    activeFilters.push({
      key: "q",
      label: `Busca: "${searchParams.get("q")}"`,
    });

  if (currentCategoria) {
    const found = categorias.find((c) => c.value === currentCategoria);
    activeFilters.push({
      key: "categoria",
      label: `Categoria: ${found?.label || currentCategoria}`,
    });
  }

  if (currentMarca) {
    const found = marcas.find((m) => m.value === currentMarca);
    activeFilters.push({
      key: "marca",
      label: `Marca: ${found?.label || currentMarca}`,
    });
  }

  if (currentSubcategoria && hasCategoria) {
    const found = subcategorias.find((s) => s.value === currentSubcategoria);
    activeFilters.push({
      key: "subcategoria",
      label: `Sub: ${found?.label || currentSubcategoria}`,
    });
  }

  if (semNcm) activeFilters.push({ key: "semNcm", label: "Sem NCM" });

  const hasFilters = activeFilters.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
      <div className="p-3 flex flex-wrap items-end gap-3">
        {/* BUSCA */}
        <form onSubmit={handleSearch} className="flex gap-1.5 min-w-50 flex-2">
          <div className="relative flex-1">
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
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            Buscar
          </button>
        </form>

        <FilterSelect
          label="Categoria"
          value={currentCategoria}
          onChange={handleCategoriaChange}
          options={categorias}
          placeholder="Todas as Categorias"
        />

        <FilterSelect
          label="Subcategoria"
          value={currentSubcategoria}
          onChange={(v) => setParam("subcategoria", v)}
          options={subcategorias}
          placeholder="Todas as Subcategorias"
          disabled={!hasCategoria}
        />

        <FilterSelect
          label="Marca"
          value={currentMarca}
          onChange={(v) => setParam("marca", v)}
          options={marcas}
          placeholder="Todas as Marcas"
        />

        {/* TOGGLE: SEM NCM */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            &nbsp;
          </label>
          <button
            onClick={toggleSemNcm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${
              semNcm
                ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
            }`}
          >
            {semNcm ? "✓ Sem NCM" : "Sem NCM"}
          </button>
        </div>

        {/* LIMPAR TUDO */}
        {hasFilters && (
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              &nbsp;
            </label>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all whitespace-nowrap"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* CHIPS DE FILTROS ATIVOS */}
      {hasFilters && (
        <div className="px-3 pb-3 pt-0 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setParam(f.key, null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              {f.label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
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
          ))}
          <span className="text-[10px] font-bold text-slate-400 ml-1">
            {activeFilters.length} filtro(s)
          </span>
        </div>
      )}
    </div>
  );
}
