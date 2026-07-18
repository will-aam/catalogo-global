"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type NCMItem = {
  id: number;
  codigo: string;
  descricao: string;
};

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
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/ncm?q=${encodeURIComponent(search)}&page=1`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg(null);
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
          setImportMsg("Formato não reconhecido. Envie um array JSON.");
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
        setImportMsg("Nenhum NCM válido encontrado no arquivo.");
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
        setImportMsg(
          `Importados ${result.imported} de ${normalized.length} NCMs com sucesso!`,
        );
        setImportProgress("");
        router.refresh();
      } else {
        setImportMsg(`Erro: ${result.error}`);
        setImportProgress("");
      }
    } catch {
      setImportMsg(
        "Erro ao processar o arquivo. Verifique se é um JSON válido.",
      );
      setImportProgress("");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Remover todos os NCMs importados?")) return;

    const res = await fetch("/api/ncm", { method: "DELETE" });
    if (res.ok) {
      router.refresh();
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
              onClick={handleClear}
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

      {/* MENSAGENS */}
      {importMsg && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            importMsg.includes("Erro") || importMsg.includes("Nenhum")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {importMsg}
        </div>
      )}

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
    </div>
  );
}
