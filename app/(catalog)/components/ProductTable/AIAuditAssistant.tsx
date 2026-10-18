"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type AuditProduct = {
  id: number;
  codigo_barras: string;
  descricao: string;
  ncm: string | null;
  marca: string | null;
  categoria: string | null;
  subcategoria: string | null;
};

type NcmOption = { codigo: string; descricao: string };
type Classification = {
  categoria: string;
  categoriaAcao: "preencher" | "manter" | "corrigir" | "sem_sugestao";
  marca: string | null;
  marcaAcao: "preencher" | "manter" | "corrigir" | "sem_sugestao";
  ncmSugerido: NcmOption | null;
  ncmStatus: "preencher" | "manter" | "corrigir" | "confirmado" | "sem_sugestao";
  alternativasNcm: NcmOption[];
  evidenciaWeb: string;
  justificativa: string;
  fontesWeb: { title: string; url: string; score: number }[];
};

const actionLabels: Record<string, string> = {
  preencher: "Campo vazio: sugestão para preencher",
  manter: "Valor atual parece correto",
  corrigir: "Possível divergência: revise a correção",
  confirmado: "Código atual confirmado",
  sem_sugestao: "Sem evidência suficiente para sugerir",
};

export default function AIAuditAssistant({
  selectedProducts = [],
}: {
  selectedProducts: AuditProduct[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestion, setSuggestion] = useState<Classification | null>(null);
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [ncm, setNcm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const product = selectedProducts[currentIndex] || null;

  const open = () => {
    setCurrentIndex(0);
    setSuggestion(null);
    setCategoria(selectedProducts[0]?.categoria || "");
    setMarca(selectedProducts[0]?.marca || "");
    setNcm(selectedProducts[0]?.ncm || "");
    setError("");
    setDone(false);
    setIsOpen(true);
  };

  const generateSuggestion = async () => {
    if (!product) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar sugestões.");
      }
      setSuggestion(data);
      setCategoria(
        data.categoriaAcao === "preencher" || data.categoriaAcao === "corrigir"
          ? data.categoria || product.categoria || ""
          : product.categoria || "",
      );
      setMarca(
        data.marcaAcao === "preencher" || data.marcaAcao === "corrigir"
          ? data.marca || product.marca || ""
          : product.marca || "",
      );
      setNcm(
        data.ncmStatus === "preencher" || data.ncmStatus === "corrigir"
          ? data.ncmSugerido?.codigo || product.ncm || ""
          : product.ncm || "",
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erro ao analisar o produto.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goToProduct = (index: number) => {
    setCurrentIndex(index);
    setSuggestion(null);
    setCategoria(selectedProducts[index]?.categoria || "");
    setMarca(selectedProducts[index]?.marca || "");
    setNcm(selectedProducts[index]?.ncm || "");
    setError("");
  };

  const saveAndContinue = async () => {
    if (!product || !suggestion) return;
    const normalizedNcm = ncm.replace(/\D/g, "");
    const originalNcm = (product.ncm || "").replace(/\D/g, "");
    const selectedOfficialNcm = suggestion.alternativasNcm.some(
      (option) => option.codigo.replace(/\D/g, "") === normalizedNcm,
    );
    if (normalizedNcm !== originalNcm && !selectedOfficialNcm) {
      setError("Para alterar o NCM, selecione um código encontrado na tabela oficial.");
      return;
    }
    if (suggestion.ncmStatus === "corrigir" && normalizedNcm === originalNcm) {
      setError("A IA encontrou uma divergência no NCM. Selecione a correção oficial antes de salvar.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          categoria,
          marca,
          ncm: normalizedNcm,
        }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar a auditoria.");

      router.refresh();
      if (currentIndex + 1 >= selectedProducts.length) {
        setDone(true);
      } else {
        goToProduct(currentIndex + 1);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    if (currentIndex + 1 >= selectedProducts.length) {
      setDone(true);
    } else {
      goToProduct(currentIndex + 1);
    }
  };

  return (
    <>
      {selectedProducts.length > 0 && (
        <button
          type="button"
          onClick={open}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
        >
          ✨ Revisar seleção ({selectedProducts.length})
        </button>
      )}

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-2 sm:p-4">
          <button
            type="button"
            aria-label="Fechar auditoria"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <section className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
            <header className="z-10 flex shrink-0 items-center justify-between border-b bg-white px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Revisão assistida por IA</h2>
                <p className="text-xs text-slate-500">
                  Item {Math.min(currentIndex + 1, selectedProducts.length)} de {selectedProducts.length}. A IA só é consultada quando você pedir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                Fechar
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {loading && (
                <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-5 text-sm font-medium text-violet-800">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
                  Consultando Tavily, Groq e a tabela oficial de NCM…
                </div>
              )}

              {done && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
                  Fim da seleção. Os itens pulados foram mantidos sem alteração.
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {product && !done && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Produto no Prisma</p>
                    <p className="mt-1 font-medium text-slate-900">{product.descricao}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">Código de barras: {product.codigo_barras}</p>
                  </div>

                  {!suggestion && !loading && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <p className="text-sm text-violet-900">Nenhuma chamada foi feita para este item ainda. Gere a sugestão quando quiser usar sua cota de pesquisa e IA.</p>
                      <button type="button" onClick={() => void generateSuggestion()} className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                        ✨ Gerar sugestão para este item
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                        <span>Categoria (existente ou nova)</span>
                        {suggestion && <span className={`text-[11px] font-medium ${suggestion.categoriaAcao === "corrigir" ? "text-amber-700" : "text-slate-500"}`}>{actionLabels[suggestion.categoriaAcao]}</span>}
                      </span>
                      <input value={categoria} onChange={(event) => setCategoria(event.target.value)} disabled={!suggestion || loading} placeholder="A IA sugerirá uma categoria" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-600" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                        <span>Marca</span>
                        {suggestion && <span className={`text-[11px] font-medium ${suggestion.marcaAcao === "corrigir" ? "text-amber-700" : "text-slate-500"}`}>{actionLabels[suggestion.marcaAcao]}</span>}
                      </span>
                      <input value={marca} onChange={(event) => setMarca(event.target.value)} placeholder="A IA sugerirá uma marca" disabled={!suggestion || loading} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-600" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                        <span>NCM</span>
                        {suggestion && <span className={`text-[11px] font-medium ${suggestion.ncmStatus === "corrigir" ? "text-amber-700" : "text-slate-500"}`}>{actionLabels[suggestion.ncmStatus]}</span>}
                      </span>
                      <input value={ncm} readOnly placeholder="Sem código validado" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none" />
                    </label>

                    {suggestion?.alternativasNcm.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opções encontradas na tabela oficial</p>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {suggestion.alternativasNcm.map((option) => (
                            <button key={option.codigo} type="button" onClick={() => setNcm(option.codigo.replace(/\D/g, ""))} className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-xs hover:border-violet-400 hover:bg-violet-50 ${ncm === option.codigo.replace(/\D/g, "") ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>
                              <span className="shrink-0 font-mono font-bold text-violet-700">{option.codigo}</span>
                              <span className="text-slate-600">{option.descricao}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {suggestion && suggestion.alternativasNcm.length === 0 && (
                      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        Nenhum código compatível foi localizado na tabela oficial. O NCM atual será preservado até você escolher uma opção validada.
                      </p>
                    )}

                    {suggestion && (
                      <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-950">
                        <p><strong>Pesquisa na internet:</strong> {suggestion.evidenciaWeb}</p>
                        {suggestion.fontesWeb?.length > 0 && (
                          <div>
                            <strong>Fontes consultadas pela Tavily:</strong>
                            <ul className="mt-1 list-inside list-disc space-y-1">
                              {suggestion.fontesWeb.map((source) => (
                                <li key={source.url}>
                                  <a href={source.url} target="_blank" rel="noreferrer" className="text-sky-800 underline decoration-sky-400 underline-offset-2 hover:text-sky-950">
                                    {source.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p><strong>Auditoria:</strong> {suggestion.justificativa}</p>
                        <p className="text-slate-700">Revise os campos sinalizados antes de salvar. Para trocar o NCM, escolha um código da tabela oficial acima.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t bg-white px-4 py-3 sm:px-6 sm:py-4">
              {!done && product && (
                <>
                  <button type="button" onClick={skip} disabled={loading || saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Pular sem salvar</button>
                  <button type="button" onClick={saveAndContinue} disabled={saving || loading || !suggestion} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">{saving ? "Salvando…" : currentIndex + 1 === selectedProducts.length ? "Salvar revisão" : "Salvar e próximo item"}</button>
                </>
              )}
              {done && <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Concluir</button>}
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
