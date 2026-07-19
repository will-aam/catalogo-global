"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FeedbackType = "success" | "error";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
} | null;

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
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const router = useRouter();

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ type, title, message });
  };

  const handleReplace = async () => {
    if (!oldNcm.trim() || !newNcm.trim()) {
      showFeedback(
        "error",
        "Campos Incompletos",
        "Preencha o NCM atual e o novo NCM antes de substituir.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products/replace-ncm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldNcm, newNcm }),
      });

      if (res.ok) {
        const data = await res.json();
        setOldNcm("");
        setNewNcm("");
        router.refresh();
        showFeedback(
          "success",
          "Substituição Concluída",
          `${data.count} produtos foram atualizados com sucesso.`,
        );
      } else {
        showFeedback(
          "error",
          "Erro na Substituição",
          "Não foi possível substituir o NCM.",
        );
      }
    } catch (error) {
      console.error(error);
      showFeedback(
        "error",
        "Erro de Ligação",
        "Ocorreu um erro de conexão ao processar a solicitação.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Cabeçalho */}
          <div className="bg-linear-to-r from-blue-500 to-blue-600 p-5 text-center relative">
            <button
              onClick={onClose}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="m3 7 5 5-5 5" />
                <path d="M21 7h-8" />
                <path d="M21 17h-8" />
                <path d="M13 12h8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">
              Localizar e Substituir NCM
            </h3>
          </div>

          {/* Corpo */}
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500">
                NCM Atual (a ser substituído)
              </label>
              <input
                className="w-full p-2 mt-1 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                value={oldNcm}
                onChange={(e) => setOldNcm(e.target.value)}
                placeholder="Ex: 23091000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">
                Novo NCM
              </label>
              <input
                className="w-full p-2 mt-1 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                value={newNcm}
                onChange={(e) => setNewNcm(e.target.value)}
                placeholder="Ex: 23099010"
              />
            </div>
          </div>

          {/* Rodapé */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReplace}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
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
                  Substituindo...
                </>
              ) : (
                "Substituir"
              )}
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
