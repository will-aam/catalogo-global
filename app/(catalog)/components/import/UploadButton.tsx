"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TEMPLATE_FILE_NAME,
  TEMPLATE_COLUMNS,
  TEMPLATE_SAMPLE_ROW,
} from "@/app/(catalog)/constants";

type FeedbackType = "success" | "error";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
} | null;

export default function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ type, title, message });
  };

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

        showFeedback(
          "success",
          "Importação Concluída",
          `${total} produtos processados.\n• Criados: ${criados}\n• Atualizados: ${atualizados}`,
        );
        router.refresh();
      } else {
        showFeedback(
          "error",
          "Erro na Importação",
          result.error ?? "Falha ao importar arquivo.",
        );
      }
    } catch (error) {
      console.error(error);
      showFeedback(
        "error",
        "Erro de Ligação",
        "Não foi possível enviar o arquivo. Verifique a sua conexão.",
      );
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

      {/* MODAL DE FEEDBACK (substitui alert()) — só fecha pelo X ou botão OK */}
      {feedback && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop SEM onClick — clicar fora não fecha */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-5 text-center relative ${
                feedback.type === "success"
                  ? "bg-linear-to-r from-green-500 to-green-600"
                  : "bg-linear-to-r from-red-500 to-red-600"
              }`}
            >
              <button
                onClick={() => setFeedback(null)}
                className="absolute top-3 right-3 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                {feedback.type === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{feedback.title}</h3>
            </div>

            <div className="p-5 text-center">
              <p className="text-sm text-slate-600 font-medium whitespace-pre-line">
                {feedback.message}
              </p>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setFeedback(null)}
                className={`w-full px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${
                  feedback.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
