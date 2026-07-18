"use client";

import { useState, useRef, useEffect } from "react";

type MergeModalProps = {
  sourceName: string;
  field: "categoria" | "subcategoria" | "marca";
  existingItems: string[];
  onClose: () => void;
  onMerged: () => void;
};

export default function MergeModal({
  sourceName,
  field,
  existingItems,
  onClose,
  onMerged,
}: MergeModalProps) {
  const [targetName, setTargetName] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = existingItems.filter(
    (item) =>
      item.toLowerCase().includes(targetName.toLowerCase()) &&
      item.toLowerCase() !== sourceName.toLowerCase(),
  );

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleMerge = async () => {
    const trimmed = targetName.trim();
    if (!trimmed) {
      setError("Informe o nome de destino");
      return;
    }
    if (trimmed.toLowerCase() === sourceName.toLowerCase()) {
      setError("O destino deve ser diferente da origem");
      return;
    }

    setIsMerging(true);
    setError("");

    try {
      const res = await fetch(`/api/${field}s/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceName, targetName: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao mesclar");
      }

      onMerged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao mesclar");
    } finally {
      setIsMerging(false);
    }
  };

  const fieldLabel =
    field === "categoria"
      ? "Categoria"
      : field === "subcategoria"
        ? "Subcategoria"
        : "Marca";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/80"
            >
              <path d="M16 3h5v5" />
              <path d="M8 3H3v5" />
              <path d="M12 22v-8.3" />
              <path d="m7 16-4 4" />
              <path d="m17 20 4-4" />
            </svg>
            Mesclar {fieldLabel}
          </h3>
          <p className="text-sm text-white/80 mt-1">
            Mova todos os itens de{" "}
            <span className="font-bold text-white">
              &ldquo;{sourceName}&rdquo;
            </span>{" "}
            para outro nome
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Origem
            </label>
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">
              {sourceName}
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Destino
            </label>
            <input
              ref={inputRef}
              type="text"
              value={targetName}
              onChange={(e) => {
                setTargetName(e.target.value);
                setError("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMerge();
                if (e.key === "Escape") onClose();
              }}
              placeholder="Nome de destino ou novo nome..."
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />

            {showSuggestions &&
              filteredSuggestions.length > 0 &&
              targetName && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setTargetName(item);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
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
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleMerge}
            disabled={isMerging || !targetName.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isMerging ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Mesclando...
              </>
            ) : (
              <>
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
                Mesclar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
