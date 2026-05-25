"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const TEMPLATE_FILE_NAME = "modelo-importacao.csv";
const TEMPLATE_COLUMNS = ["codigo_barras", "descricao", "ncm", "categoria", "marca"];
const TEMPLATE_SAMPLE_ROW = [
  "7891234567890",
  "Produto Exemplo",
  "22030000",
  "BEBIDAS",
  "MARCA EXEMPLO",
];

export default function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Sucesso! ${result.inseridos} produtos foram inseridos.`);
        router.refresh(); // Atualiza a tabela na tela automaticamente
      } else {
        alert(`Erro: ${result.error}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro ao enviar o arquivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Limpa o input
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `${TEMPLATE_COLUMNS.join(",")}\n${TEMPLATE_SAMPLE_ROW.join(",")}`;
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = TEMPLATE_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors shadow-sm
          ${isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isUploading ? "Importando..." : "Importar CSV"}
      </button>
      <button
        type="button"
        onClick={handleDownloadTemplate}
        className="px-4 py-2 rounded-lg font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
      >
        Baixar modelo CSV
      </button>
    </div>
  );
}
