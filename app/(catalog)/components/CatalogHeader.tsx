"use client";

import { useEffect, useRef, useState } from "react";
import UploadButton from "./import/UploadButton";
import XMLUploadButton from "./import/XMLUploadButton";
import PDFUploadButton from "./import/PDFUploadButton";

export default function CatalogHeader({ totalItens }: { totalItens: number }) {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isImportMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (document.querySelector('[data-import-modal="open"]')) return;

      if (
        event.target instanceof Node &&
        !importMenuRef.current?.contains(event.target)
      ) {
        setIsImportMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImportMenuOpen(false);
        importButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImportMenuOpen]);

  return (
    <header className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Catálogo Global
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Revise, organize e importe sua base de produtos.
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-right sm:hidden">
          <span className="block text-[10px] font-semibold text-blue-600">
            Produtos no resultado
          </span>
          <span className="block text-xl font-extrabold leading-tight tabular-nums text-blue-800">
            {totalItens.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <div className="hidden rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-right sm:block">
          <span className="block text-[10px] font-semibold text-blue-600">
            Produtos no resultado
          </span>
          <span className="block text-2xl font-extrabold leading-tight tabular-nums text-blue-800">
            {totalItens.toLocaleString("pt-BR")}
          </span>
        </div>

        <div className="relative w-full sm:w-auto" ref={importMenuRef}>
          <button
            ref={importButtonRef}
            type="button"
            aria-expanded={isImportMenuOpen}
            aria-haspopup="dialog"
            aria-controls="catalog-import-menu"
            onClick={() => setIsImportMenuOpen((open) => !open)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
            </svg>
            Importar dados
            <svg
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${isImportMenuOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="m5.25 7.5 4.75 4.75 4.75-4.75" />
            </svg>
          </button>

          {isImportMenuOpen && (
            <div
              id="catalog-import-menu"
              role="dialog"
              aria-label="Opções de importação"
              className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-8rem)] w-full min-w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:w-80"
            >
              <div className="mb-3 border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-800">
                  Importar produtos
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Escolha a origem dos dados para continuar.
                </p>
              </div>

              <div className="space-y-3">
                <section aria-labelledby="import-csv-title">
                  <h3
                    id="import-csv-title"
                    className="mb-1 text-xs font-semibold text-slate-700"
                  >
                    Planilha CSV
                  </h3>
                  <p className="mb-2 text-[11px] leading-4 text-slate-500">
                    Importe produtos de uma planilha ou baixe o modelo.
                  </p>
                  <UploadButton />
                </section>

                <section aria-labelledby="import-xml-title">
                  <h3
                    id="import-xml-title"
                    className="mb-1 text-xs font-semibold text-slate-700"
                  >
                    Notas fiscais XML
                  </h3>
                  <p className="mb-2 text-[11px] leading-4 text-slate-500">
                    Processe vários arquivos e, se quiser, informe uma marca.
                  </p>
                  <XMLUploadButton />
                </section>

                <section aria-labelledby="import-pdf-title">
                  <h3
                    id="import-pdf-title"
                    className="mb-1 text-xs font-semibold text-slate-700"
                  >
                    Catálogo em PDF
                  </h3>
                  <p className="mb-2 text-[11px] leading-4 text-slate-500">
                    Extraia os produtos e revise os dados antes de salvar.
                  </p>
                  <PDFUploadButton />
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
