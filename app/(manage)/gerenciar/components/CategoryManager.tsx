"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RenameInline from "./RenameInline";
import MergeModal from "./MergeModal/MergeModal";
import type { ManagedItem } from "../types";

type CategoryManagerProps = {
  categorias: ManagedItem[];
};

export default function CategoryManager({ categorias }: CategoryManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const filtered = categorias.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedItem(name);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const existingNames = categorias.map((c) => c.name);

  return (
    <div className="space-y-3">
      <div className="relative">
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
          placeholder="Filtrar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {filtered.map((cat) => {
          const isSemCategoria = cat.name === "Sem Categoria";
          return (
            <div
              key={cat.name}
              className="group flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
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
                  className={`shrink-0 ${isSemCategoria ? "text-slate-300" : "text-slate-400"}`}
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {isSemCategoria ? (
                  <span className="text-sm font-semibold text-slate-400 italic">
                    {cat.name}
                  </span>
                ) : (
                  <RenameInline
                    currentName={cat.name}
                    field="categoria"
                    onRenamed={() => router.refresh()}
                  />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {cat.count}
                </span>

                {!isSemCategoria && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(cat.name)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Copiar nome"
                    >
                      {copiedItem === cat.name ? (
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
                          <polyline points="20 6 9 17 4 12" />
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
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => setMergeTarget(cat.name)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title="Mesclar"
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
                        <path d="M8 3H3v5" />
                        <path d="m7 8-4-4" />
                        <path d="M16 3h5v5" />
                        <path d="m17 8 4-4" />
                        <path d="M12 22v-8.3" />
                        <path d="m7 16 4 4" />
                        <path d="m17 16-4 4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">
            Nenhuma categoria encontrada.
          </div>
        )}
      </div>

      {mergeTarget && (
        <MergeModal
          sourceName={mergeTarget}
          field="categoria"
          existingItems={existingNames}
          onClose={() => setMergeTarget(null)}
          onMerged={() => {
            setMergeTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
