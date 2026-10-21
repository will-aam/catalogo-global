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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string | null) => void;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const selectId = `filter-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div
      className={`flex min-w-0 flex-col transition-opacity ${className} ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <label
        htmlFor={selectId}
        className="mb-1 text-[11px] font-semibold text-slate-600"
      >
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-position-[right_10px_center] bg-no-repeat px-3 py-2 pr-8 text-sm text-slate-700 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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
  status,
}: {
  categorias: FilterOption[];
  marcas: FilterOption[];
  subcategorias: FilterOption[];
  status: FilterOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const currentCategoria = searchParams.get("categoria") || "";
  const currentMarca = searchParams.get("marca") || "";
  const currentSubcategoria = searchParams.get("subcategoria") || "";
  const semNcm = searchParams.get("semNcm") === "true";
  const currentStatus = searchParams.get("status") || "";

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

  const clearAll = () => {
    setSearchTerm("");
    router.push("/");
  };

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

  if (currentStatus) {
    const found = status.find((option) => option.value === currentStatus);
    activeFilters.push({
      key: "status",
      label: `Status: ${found?.label || currentStatus}`,
    });
  }

  const hasFilters = activeFilters.length > 0;

  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 items-end gap-3 p-3 sm:grid-cols-2 xl:grid-cols-12">
        <form
          onSubmit={handleSearch}
          aria-label="Buscar produtos"
          className="flex min-w-0 gap-1.5 sm:col-span-2 xl:col-span-2"
        >
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
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              aria-label="Buscar por descrição ou código de barras"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  if (searchParams.get("q")) setParam("q", null);
                }}
                aria-label="Limpar texto da busca"
                title="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Buscar produtos"
            title="Buscar produtos"
            className="flex min-h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 p-2 text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
          </button>
        </form>

        <FilterSelect
          label="Categoria"
          value={currentCategoria}
          onChange={handleCategoriaChange}
          options={categorias}
          placeholder="Todas as Categorias"
          className="xl:col-span-2"
        />

        <FilterSelect
          label="Subcategoria"
          value={currentSubcategoria}
          onChange={(v) => setParam("subcategoria", v)}
          options={subcategorias}
          placeholder="Todas as Subcategorias"
          disabled={!hasCategoria}
          className="xl:col-span-2"
        />

        <FilterSelect
          label="Marca"
          value={currentMarca}
          onChange={(v) => setParam("marca", v)}
          options={marcas}
          placeholder="Todas as Marcas"
          className="xl:col-span-2"
        />

        <FilterSelect
          label="Status da revisão"
          value={currentStatus}
          onChange={(value) => setParam("status", value)}
          options={status}
          placeholder="Todos os status"
          className="xl:col-span-2"
        />

        <div className="flex min-w-0 items-end xl:col-span-2">
          <button
            type="button"
            onClick={toggleSemNcm}
            aria-pressed={semNcm}
            className={`min-h-10 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              semNcm
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span aria-hidden="true" className="mr-1.5">
              {semNcm ? "✓" : "○"}
            </span>
            Sem NCM
          </button>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2.5">
          <span
            aria-live="polite"
            className="mr-1 text-xs font-semibold text-slate-500"
          >
            {activeFilters.length} {activeFilters.length === 1 ? "filtro ativo" : "filtros ativos"}:
          </span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setParam(filter.key, null)}
              aria-label={`Remover filtro: ${filter.label}`}
              title="Remover este filtro"
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 transition-colors hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="truncate">{filter.label}</span>
              <svg
                aria-hidden="true"
                className="shrink-0"
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
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
