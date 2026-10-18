import Link from "next/link";
import { OrigemClassificacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const originMeta: Record<OrigemClassificacao, { label: string; dot: string }> = {
  IA: { label: "Com IA", dot: "bg-violet-500" },
  MANUAL: { label: "Manual", dot: "bg-blue-500" },
  LOTE: { label: "Em lote", dot: "bg-amber-500" },
};

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  accent: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        {label}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export default async function PainelPage() {
  const today = dateKey(new Date());
  const activityWindowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [totalProdutos, revisoesSalvas, revisoesPorOrigem, ncmPreenchido, categoriaPreenchida, subcategoriaPreenchida, marcaPreenchida, pendentes, produtosRevisados, atividadePorDia, camposConfirmados, historicoRecente, groqRequests, groqSuccesses, groqRateLimits, groqTokens, groqRecent] = await Promise.all([
    prisma.produtoGlobal.count(),
    prisma.historicoClassificacao.count(),
    prisma.historicoClassificacao.groupBy({
      by: ["origem"],
      _count: { id: true },
    }),
    prisma.produtoGlobal.count({ where: { NOT: [{ ncm: null }, { ncm: "" }] } }),
    prisma.produtoGlobal.count({ where: { NOT: [{ categoria: null }, { categoria: "" }] } }),
    prisma.produtoGlobal.count({ where: { NOT: [{ subcategoria: null }, { subcategoria: "" }] } }),
    prisma.produtoGlobal.count({ where: { NOT: [{ marca: null }, { marca: "" }] } }),
    prisma.produtoGlobal.count({ where: { status_auditoria: "PENDENTE" } }),
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(DISTINCT "produto_id") AS total
      FROM "historico_classificacao"
    `,
    prisma.$queryRaw<Array<{ dia: string; origem: OrigemClassificacao; total: number }>>`
      SELECT TO_CHAR("criado_em" AT TIME ZONE 'America/Fortaleza', 'YYYY-MM-DD') AS dia,
             "origem",
             COUNT(*)::int AS total
      FROM "historico_classificacao"
      WHERE "criado_em" >= ${activityWindowStart}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<Array<{ total: number }>>`
      SELECT (
        COALESCE(SUM(CASE WHEN "confirmou_ncm" THEN 1 ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN "confirmou_categoria" THEN 1 ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN "confirmou_subcategoria" THEN 1 ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN "confirmou_marca" THEN 1 ELSE 0 END), 0)
      )::int AS total
      FROM "historico_classificacao"
      WHERE "criado_em" >= ${activityWindowStart}
    `,
    prisma.historicoClassificacao.findMany({
      where: { criado_em: { gte: activityWindowStart } },
      orderBy: { criado_em: "desc" },
      take: 8,
      select: {
        produto_id: true,
        descricao: true,
        origem: true,
        ncm: true,
        categoria: true,
        subcategoria: true,
        marca: true,
        confirmou_ncm: true,
        confirmou_categoria: true,
        confirmou_subcategoria: true,
        confirmou_marca: true,
        criado_em: true,
      },
    }),
    prisma.groqRequestLog.count(),
    prisma.groqRequestLog.count({ where: { statusCode: { gte: 200, lt: 300 } } }),
    prisma.groqRequestLog.count({ where: { statusCode: 429 } }),
    prisma.groqRequestLog.aggregate({
      _sum: { inputTokens: true, outputTokens: true, inputCachedTokens: true },
    }),
    prisma.groqRequestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        requestId: true,
        createdAt: true,
        statusCode: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        errorMessage: true,
      },
    }),
  ]);

  const byOrigin = new Map(
    revisoesPorOrigem.map((item) => [item.origem, item._count.id]),
  );
  const uniqueReviewed = Number(produtosRevisados[0]?.total || 0);
  const activityDays = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - (13 - index));
    const key = dateKey(day);
    return { key, label: new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" }).format(day), IA: 0, MANUAL: 0, LOTE: 0 };
  });
  const activityByDay = new Map(activityDays.map((day) => [day.key, day]));
  for (const item of atividadePorDia) {
    const day = activityByDay.get(item.dia);
    if (day) day[item.origem] = item.total;
  }
  const maxDailyActivity = Math.max(1, ...activityDays.map((day) => day.IA + day.MANUAL + day.LOTE));
  const fieldStats = [
    { label: "NCM", filled: ncmPreenchido, color: "bg-violet-500" },
    { label: "Categoria", filled: categoriaPreenchida, color: "bg-blue-500" },
    { label: "Subcategoria", filled: subcategoriaPreenchida, color: "bg-cyan-500" },
    { label: "Marca", filled: marcaPreenchida, color: "bg-amber-500" },
  ];
  const confirmedFieldCount = camposConfirmados[0]?.total || 0;
  const groqTotalTokens = (groqTokens._sum.inputTokens || 0) + (groqTokens._sum.outputTokens || 0);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Visão geral do sistema</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Painel de atividades</h1>
            <p className="mt-1 text-sm text-slate-500">Acompanhe revisões, uso da IA e a cobertura do seu catálogo.</p>
          </div>
          <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
            Abrir catálogo <span aria-hidden="true">→</span>
          </Link>
        </header>

        <section aria-label="Resumo do catálogo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Produtos no catálogo" value={totalProdutos} detail="Total de itens cadastrados" accent="bg-slate-500" />
          <StatCard label="Revisões salvas" value={revisoesSalvas} detail={`${uniqueReviewed.toLocaleString("pt-BR")} produtos com atividade`} accent="bg-emerald-500" />
          <StatCard label="Revisões com IA" value={byOrigin.get(OrigemClassificacao.IA) || 0} detail="Sugestões salvas por você" accent="bg-violet-500" />
          <StatCard label="Revisões manuais" value={byOrigin.get(OrigemClassificacao.MANUAL) || 0} detail="Edições individuais salvas" accent="bg-blue-500" />
          <StatCard label="Atualizações em lote" value={byOrigin.get(OrigemClassificacao.LOTE) || 0} detail="Itens alterados em operações em lote" accent="bg-amber-500" />
        </section>

        <section aria-label="Uso da IA Groq" className="space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">Uso da IA (Groq)</h2>
            <p className="mt-1 text-xs text-slate-500">Inclui os registros importados do console e as chamadas feitas pelo sistema.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Requisições" value={groqRequests} detail="Registros de uso armazenados" accent="bg-slate-500" />
            <StatCard label="Concluídas" value={groqSuccesses} detail="Respostas bem-sucedidas" accent="bg-emerald-500" />
            <StatCard label="Limite atingido" value={groqRateLimits} detail="Respostas HTTP 429" accent="bg-rose-500" />
            <StatCard label="Tokens processados" value={groqTotalTokens} detail={`${(groqTokens._sum.inputCachedTokens || 0).toLocaleString("pt-BR")} tokens de entrada em cache`} accent="bg-violet-500" />
          </div>
          {groqRecent.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-800">Chamadas recentes</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {groqRecent.map((request) => (
                  <div key={request.requestId} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${request.statusCode >= 200 && request.statusCode < 300 ? "bg-emerald-500" : request.statusCode === 429 ? "bg-rose-500" : "bg-amber-500"}`} />
                      <span className="font-medium text-slate-800">HTTP {request.statusCode}</span>
                      <span className="text-slate-400">{request.model}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {request.errorMessage && <span className="font-medium text-rose-700">{request.errorMessage}</span>}
                      <span>{(request.inputTokens + request.outputTokens).toLocaleString("pt-BR")} tokens</span>
                      <time>{formatDate(request.createdAt)}</time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Atividade nos últimos 14 dias</h2>
                <p className="mt-1 text-xs text-slate-500">Cada coluna representa revisões ou alterações salvas no dia.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {Object.entries(originMeta).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${value.dot}`} />{value.label}</span>
                ))}
              </div>
            </div>
            {atividadePorDia.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">As atividades aparecerão aqui</p>
                <p className="mt-1 text-sm text-slate-500">Salve uma revisão manual ou assistida por IA para começar a acompanhar o uso.</p>
              </div>
            ) : (
              <div role="img" aria-label="Gráfico de revisões diárias por origem" className="mt-7 flex h-52 items-end gap-1.5 border-b border-slate-200 px-1 sm:gap-3">
                {activityDays.map((day) => {
                  const segments = [
                    { key: "IA", value: day.IA, color: "bg-violet-500" },
                    { key: "MANUAL", value: day.MANUAL, color: "bg-blue-500" },
                    { key: "LOTE", value: day.LOTE, color: "bg-amber-500" },
                  ];
                  return (
                    <div key={day.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                      <span className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg group-hover:block group-focus-within:block">
                        {day.label}: {day.IA + day.MANUAL + day.LOTE} atividade(s)
                      </span>
                      <div className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-md bg-slate-100" style={{ height: `${Math.max(4, ((day.IA + day.MANUAL + day.LOTE) / maxDailyActivity) * 100)}%` }}>
                        {segments.map((segment) => segment.value > 0 && (
                          <div key={segment.key} className={`w-full ${segment.color}`} style={{ height: `${(segment.value / (day.IA + day.MANUAL + day.LOTE)) * 100}%`, minHeight: 3 }} />
                        ))}
                      </div>
                      <span className="mt-2 h-4 text-[9px] text-slate-400 sm:text-[10px]">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {confirmedFieldCount > 0 && (
              <p className="mt-3 text-xs text-slate-500">{confirmedFieldCount.toLocaleString("pt-BR")} campos confirmados ou corrigidos nas revisões exibidas.</p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Cobertura do catálogo</h2>
                <p className="mt-1 text-xs text-slate-500">Produtos com cada informação preenchida.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{pendentes.toLocaleString("pt-BR")} pendentes</span>
            </div>
            <div className="mt-6 space-y-5">
              {fieldStats.map((field) => {
                const percent = totalProdutos ? Math.round((field.filled / totalProdutos) * 100) : 0;
                return (
                  <div key={field.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{field.label}</span>
                      <span className="tabular-nums text-slate-500">{field.filled.toLocaleString("pt-BR")} <span className="text-xs">({percent}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${field.color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div><p className="text-xs text-slate-500">Produtos revisados</p><p className="mt-1 font-bold text-slate-900">{uniqueReviewed.toLocaleString("pt-BR")}</p></div>
              <div><p className="text-xs text-slate-500">Ainda sem revisão</p><p className="mt-1 font-bold text-slate-900">{Math.max(0, totalProdutos - uniqueReviewed).toLocaleString("pt-BR")}</p></div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Atividade recente</h2>
              <p className="mt-1 text-xs text-slate-500">Últimas revisões e alterações salvas.</p>
            </div>
            <span className="text-xs text-slate-400">Exibindo até 8 registros</span>
          </div>
          {historicoRecente.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Nenhuma atividade registrada nos últimos 14 dias.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {historicoRecente.slice(0, 8).map((item, index) => {
                const fields = [
                  item.confirmou_ncm && "NCM",
                  item.confirmou_categoria && "categoria",
                  item.confirmou_subcategoria && "subcategoria",
                  item.confirmou_marca && "marca",
                ].filter(Boolean);
                return (
                  <div key={`${item.produto_id}-${item.criado_em.toISOString()}-${index}`} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.descricao}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{fields.length ? `Campos confirmados: ${fields.join(", ")}` : "Revisão salva sem alteração de classificação"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-600"><i className={`h-2 w-2 rounded-full ${originMeta[item.origem].dot}`} />{originMeta[item.origem].label}</span>
                      <time className="text-slate-400">{formatDate(item.criado_em)}</time>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
