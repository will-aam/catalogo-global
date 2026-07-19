"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type FeedbackType = "success" | "error";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
} | null;

export default function XMLUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [marca, setMarca] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ type, title, message });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const xmlFiles = files.filter((f) => f.name.toLowerCase().endsWith(".xml"));

    if (xmlFiles.length === 0) {
      showFeedback(
        "error",
        "Arquivo Inválido",
        "Nenhum arquivo XML válido selecionado.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: xmlFiles.length });

    let totalCriados = 0;
    let totalAtualizados = 0;
    const BATCH_SIZE = 50;

    try {
      for (let i = 0; i < xmlFiles.length; i += BATCH_SIZE) {
        const chunk = xmlFiles.slice(i, i + BATCH_SIZE);
        const formData = new FormData();

        chunk.forEach((file) => formData.append("files", file));

        if (marca.trim()) {
          formData.append("marca", marca.trim());
        }

        const res = await fetch("/api/import-xml", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          totalCriados += data.criados || 0;
          totalAtualizados += data.atualizados || 0;
        } else {
          console.error(`Erro no lote ${i}:`, data.error);
        }

        setProgress({
          current: Math.min(i + BATCH_SIZE, xmlFiles.length),
          total: xmlFiles.length,
        });
      }

      showFeedback(
        "success",
        "Importação em Lote Concluída",
        `Notas lidas: ${xmlFiles.length}\nNovos produtos inseridos: ${totalCriados}\nProdutos atualizados com NCM/Marca: ${totalAtualizados}`,
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback(
        "error",
        "Erro de Ligação",
        "Ocorreu um erro na conexão durante o envio do lote.",
      );
    } finally {
      setIsUploading(false);
      setMarca("");
      setProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    // Transformei de flex-row para flex-col, ocupando 100% da largura (w-full)
    <div className="flex flex-col w-full gap-2 bg-orange-50/50 p-2 border border-orange-100 rounded-lg">
      {/* Campo para a Marca (Agora ocupa 100% do espaço) */}
      <input
        type="text"
        placeholder="Definir Marca (opcional)"
        value={marca}
        onChange={(e) => setMarca(e.target.value)}
        disabled={isUploading}
        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-orange-500 bg-white disabled:bg-slate-100 placeholder:text-slate-400"
        title="Se preenchido, os produtos herdaram esta marca"
      />

      <input
        type="file"
        accept=".xml"
        multiple
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      {/* Botão (Agora ocupa 100% do espaço) */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full px-3 py-2 bg-orange-500 text-white rounded-md font-medium text-xs hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        title="Selecione dezenas ou centenas de XMLs de uma vez"
      >
        {isUploading
          ? `⏳ ${progress.current} / ${progress.total}`
          : "Importar XMLs"}
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
