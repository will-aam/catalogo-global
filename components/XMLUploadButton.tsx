"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function XMLUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação simples de extensão
    if (!file.name.toLowerCase().endsWith(".xml")) {
      alert("Por favor, selecione um arquivo XML válido da NF-e.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import-xml", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Sucesso! \nNovos itens criados: ${data.criados}\nItens atualizados (NCM corrigido): ${data.atualizados}`,
        );
        router.refresh(); // Atualiza a tabela na tela
      } else {
        alert(`Erro: ${data.error || "Falha ao processar XML"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro na conexão ao enviar o XML.");
    } finally {
      setIsUploading(false);
      // Limpa o input para permitir subir o mesmo arquivo de novo se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xml"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        title="Importar produtos e NCMs via XML de Nota Fiscal"
      >
        {isUploading ? "Lendo XML..." : "🧾 Importar NF-e (XML)"}
      </button>
    </div>
  );
}
