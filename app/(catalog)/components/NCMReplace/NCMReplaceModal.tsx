"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NCMReplaceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [oldNcm, setOldNcm] = useState("");
  const [newNcm, setNewNcm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReplace = async () => {
    setLoading(true);
    const res = await fetch("/api/products/replace-ncm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldNcm, newNcm }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Sucesso! ${data.count} produtos foram atualizados.`);
      router.refresh();
      onClose();
    } else {
      alert("Erro ao substituir NCM.");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200">
        <h3 className="font-extrabold text-lg mb-4 text-slate-800">
          Localizar e Substituir NCM
        </h3>

        <label className="text-xs font-bold text-slate-500">
          NCM Atual (a ser substituído)
        </label>
        <input
          className="w-full p-2 border rounded mb-3"
          value={oldNcm}
          onChange={(e) => setOldNcm(e.target.value)}
          placeholder="Ex: 23091000"
        />

        <label className="text-xs font-bold text-slate-500">Novo NCM</label>
        <input
          className="w-full p-2 border rounded mb-4"
          value={newNcm}
          onChange={(e) => setNewNcm(e.target.value)}
          placeholder="Ex: 23099010"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleReplace}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
          >
            {loading ? "Substituindo..." : "Substituir"}
          </button>
        </div>
      </div>
    </div>
  );
}
