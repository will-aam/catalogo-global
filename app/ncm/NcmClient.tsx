"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type NCMItem = {
  id: number;
  codigo: string;
  descricao: string;
};

type FeedbackType = "success" | "error";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
} | null;

export default function NcmClient({
  items,
  total,
  page,
  totalPages,
  q,
}: {
  items: NCMItem[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ type, title, message });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/ncm?q=${encodeURIComponent(search)}&page=1`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress("Lendo arquivo...");

    try {
      const text = await file.text();
      setImportProgress("Processando dados...");
      let data = JSON.parse(text);

      // Aceita array direto ou objeto com array dentro
      if (!Array.isArray(data)) {
        const keys = Object.keys(data);
        const arrayKey = keys.find((k) => Array.isArray(data[k]));
        if (arrayKey) {
          data = data[arrayKey];
        } else {
          showFeedback(
            "error",
            "Formato Inválido",
            "Formato não reconhecido. Envie um array JSON.",
          );
          return;
        }
      }

      setImportProgress(`Normalizando ${data.length} registros...`);

      // Normaliza chaves variadas da Receita
      const normalized = data
        .map((item: Record<string, unknown>) => {
          const rawCodigo = String(
            item.codigo ||
              item.Codigo ||
              item.NCM ||
              item.ncm ||
              item.codigo_ncm ||
              item.CODIGO ||
              "",
          );
          const rawDesc = String(
            item.descricao ||
              item.Descricao ||
              item.Descrição ||
              item.DESCRICAO ||
              item.description ||
              item.desc ||
              "",
          );

          // Limpa e formata o código: remove não-dígitos, adiciona pontos
          const digits = rawCodigo.replace(/\D/g, "");
          if (digits.length < 2) return null;

          const formatted =
            digits.length >= 8
              ? digits.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")
              : digits;

          return { codigo: formatted, descricao: rawDesc.trim() };
        })
        .filter(Boolean) as { codigo: string; descricao: string }[];

      if (normalized.length === 0) {
        showFeedback(
          "error",
          "Nenhum Registro Válido",
          "Nenhum NCM válido encontrado no arquivo.",
        );
        return;
      }

      setImportProgress(`Enviando ${normalized.length} NCMs para o banco...`);

      const res = await fetch("/api/ncm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });

      const result = await res.json();

      if (res.ok) {
        showFeedback(
          "success",
          "Importação Concluída",
          `Importados ${result.imported} de ${normalized.length} NCMs com sucesso!`,
        );
        router.refresh();
      } else {
        showFeedback("error", "Erro na Importação", String(result.error));
      }
    } catch {
      showFeedback(
        "error",
        "Erro no Arquivo",
        "Erro ao processar o arquivo. Verifique se é um JSON válido.",
      );
    } finally {
      setImporting(false);
      setImportProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/ncm", { method: "DELETE" });
      setShowClearConfirm(false);
      if (res.ok) {
        router.refresh();
        showFeedback(
          "success",
          "Tabela Limpa",
          "Todos os NCMs importados foram removidos.",
        );
      } else {
        showFeedback(
          "error",
          "Erro ao Limpar",
          "Não foi possível remover os NCMs importados.",
        );
      }
    } catch {
      showFeedback(
        "error",
        "Erro de Ligação",
        "Ocorreu um erro de conexão ao tentar limpar a tabela.",
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabela NCM</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0
              ? `${total.toLocaleString("pt-BR")} NCMs importados`
              : "Nenhum NCM importado"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {importing ? (
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            )}
            {importing ? "Importando..." : "Importar JSON"}
          </button>

          {total > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Limpar
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* PROGRESSO (apenas indicador, não é alerta) */}
      {importProgress && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {importProgress}
        </div>
      )}

      {/* BUSCA */}
      <form onSubmit={handleSearch}>
        <div className="relative max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </form>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-5 py-3.5 font-semibold text-gray-600 w-36">
                Código NCM
              </th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">
                Descrição
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  {q
                    ? "Nenhum NCM encontrado para esta busca."
                    : "Nenhum NCM importado. Clique em 'Importar JSON' para começar."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-5 py-2.5 font-mono font-semibold text-gray-800 text-xs">
                    {item.codigo}
                  </td>
                  <td className="px-5 py-2.5 text-gray-600 text-xs leading-relaxed">
                    {item.descricao}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Página {page} de {totalPages} — {total.toLocaleString("pt-BR")}{" "}
            registros
          </p>
          <div className="flex gap-1">
            <button
              onClick={() =>
                router.push(`/ncm?q=${encodeURIComponent(q)}&page=${page - 1}`)
              }
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                router.push(`/ncm?q=${encodeURIComponent(q)}&page=${page + 1}`)
              }
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-linear-to-r from-red-500 to-red-600 p-5 text-center relative">
              <button
                onClick={() => setShowClearConfirm(false)}
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                Limpar Tabela NCM
              </h3>
            </div>

            <div className="p-5 text-center space-y-3">
              <p className="text-sm text-slate-600 font-medium">
                Tem certeza que deseja remover todos os NCMs importados?
              </p>
              <p className="text-xs text-red-500 font-semibold">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearing ? (
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
                    Limpando...
                  </>
                ) : (
                  "Sim, Limpar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FEEDBACK — só fecha pelo X ou botão OK */}
      {feedback && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
