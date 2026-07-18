"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const TEMPLATE_FILE_NAME = "modelo-importacao.csv";
const TEMPLATE_COLUMNS = [
  "codigo_barras",
  "descricao",
  "ncm",
  "categoria",
  "subcategoria",
  "marca",
];

const TEMPLATE_SAMPLE_ROW = [
  "7891234567890",
  "Produto Exemplo",
  "22030000",
  "BEBIDAS",
  "CERVEJAS",
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
        const criados = result.criados ?? result.inseridos ?? 0;
        const atualizados = result.atualizados ?? 0;
        const total = result.total_processado ?? criados + atualizados;

        alert(
          `Sucesso! ${total} produtos processados.\n` +
            `• Criados: ${criados}\n` +
            `• Atualizados: ${atualizados}`,
        );
        router.refresh();
      } else {
        alert(`Erro: ${result.error ?? "Falha ao importar arquivo."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar o arquivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="flex items-center w-full gap-2 bg-blue-50/50 p-2 border border-blue-100 rounded-lg">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex-1 px-3 py-2 rounded-md font-medium text-xs text-white transition-colors shadow-sm flex items-center justify-center gap-2
          ${isUploading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isUploading ? "⏳ Importando..." : "Importar CSV"}
      </button>

      <button
        type="button"
        onClick={handleDownloadTemplate}
        title="Baixar modelo de planilha CSV"
        className="shrink-0 p-2 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm flex items-center justify-center"
      >
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
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      </button>
    </div>
  );
}
