"use client";

import { useState, useRef, useEffect } from "react";

type RenameInlineProps = {
  currentName: string;
  field: "categoria" | "subcategoria" | "marca";
  onRenamed: () => void;
};

export default function RenameInline({
  currentName,
  field,
  onRenamed,
}: RenameInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Nome não pode ser vazio");
      return;
    }
    if (trimmed === currentName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/${field}s/bulk-rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: currentName, newName: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao renomear");
      }

      setIsEditing(false);
      onRenamed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao renomear");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      setNewName(currentName);
      setError("");
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex-1 min-w-0 px-2.5 py-1.5 border-2 border-blue-500 rounded-lg text-sm font-semibold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          title="Salvar (Enter)"
        >
          {isSaving ? (
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
          ) : (
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setNewName(currentName);
            setError("");
          }}
          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          title="Cancelar (Esc)"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left truncate max-w-full"
      title="Clique para renomear"
    >
      {currentName}
    </button>
  );
}
