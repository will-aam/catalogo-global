"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PaginationControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  // Gera os números de página com reticências inteligentes
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 1; // quantas páginas mostrar de cada lado da atual

    // Primeira página sempre
    pages.push(1);

    // Reticência antes do bloco central
    if (currentPage - delta > 3) {
      pages.push("...");
    }

    // Bloco ao redor da página atual
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Reticência depois do bloco central
    if (currentPage + delta < totalPages - 2) {
      pages.push("...");
    }

    // Última página sempre (se não for a primeira)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const btnBase =
    "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all";
  const btnActive =
    "bg-blue-600 text-white shadow-sm shadow-blue-200 cursor-default";
  const btnInactive = "text-slate-600 hover:bg-slate-100 cursor-pointer";
  const btnDisabled = "text-slate-300 cursor-not-allowed";

  return (
    <div className="flex items-center gap-1">
      {/* Página X de Y */}
      <span className="text-xs text-slate-400 font-medium mr-2 hidden sm:inline whitespace-nowrap">
        {currentPage} de {totalPages.toLocaleString("pt-BR")}
      </span>

      {/* Anterior */}
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} ${currentPage <= 1 ? btnDisabled : btnInactive}`}
        title="Página anterior"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Números de página */}
      <div className="flex items-center gap-0.5">
        {pageNumbers.map((page, idx) =>
          page === "..." ? (
            <span
              key={`dots-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goTo(page)}
              className={`${btnBase} ${
                page === currentPage ? btnActive : btnInactive
              }`}
            >
              {page.toLocaleString("pt-BR")}
            </button>
          ),
        )}
      </div>

      {/* Próxima */}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} ${currentPage >= totalPages ? btnDisabled : btnInactive}`}
        title="Próxima página"
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
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
