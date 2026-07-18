"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CatalogoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Catalogo]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-extrabold text-slate-800 mb-2">
          Algo deu errado
        </h2>

        <p className="text-sm text-slate-500 mb-1">
          Ocorreu um erro ao carregar o catálogo.
        </p>

        {error.message && (
          <p className="text-xs text-red-400 bg-red-50 rounded-lg p-2 mb-4 font-mono break-all">
            {error.message}
          </p>
        )}

        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </main>
  );
}
