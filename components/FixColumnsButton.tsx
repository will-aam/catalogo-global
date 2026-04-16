"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FixColumnsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFix = async () => {
    const confirmed = window.confirm(
      "Isso vai mover TODOS os textos da coluna MARCA para a coluna NCM. Tem certeza?",
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/tools/fix-columns", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        alert(`Mágica feita! 🪄 ${data.count} produtos foram corrigidos.`);
        router.refresh(); // Atualiza a tabela pra você ver o resultado na hora
      } else {
        alert("Ocorreu um erro na correção.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFix}
      disabled={isLoading}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
    >
      {isLoading ? "Corrigindo..." : "🪄 Fix NCM"}
    </button>
  );
}
