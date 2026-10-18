import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordGroqUsage } from "@/lib/groq-usage";

const classificationSchema = z.object({
  categoria: z.string(),
  categoriaAcao: z.enum(["preencher", "manter", "corrigir", "sem_sugestao"]),
  marca: z.string().nullable(),
  marcaAcao: z.enum(["preencher", "manter", "corrigir", "sem_sugestao"]),
  subcategoria: z.string().nullable(),
  subcategoriaAcao: z.enum(["preencher", "manter", "corrigir", "sem_sugestao"]),
  ncmSugerido: z
    .object({ codigo: z.string(), descricao: z.string() })
    .nullable(),
  ncmStatus: z.enum(["preencher", "manter", "corrigir", "confirmado", "sem_sugestao"]),
  evidenciaWeb: z.string(),
  justificativa: z.string(),
});

const classificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    categoria: { type: "string" },
    categoriaAcao: { type: "string", enum: ["preencher", "manter", "corrigir", "sem_sugestao"] },
    marca: { type: ["string", "null"] },
    marcaAcao: { type: "string", enum: ["preencher", "manter", "corrigir", "sem_sugestao"] },
    subcategoria: { type: ["string", "null"] },
    subcategoriaAcao: { type: "string", enum: ["preencher", "manter", "corrigir", "sem_sugestao"] },
    ncmSugerido: {
      type: ["object", "null"],
      properties: {
        codigo: { type: "string" },
        descricao: { type: "string" },
      },
      required: ["codigo", "descricao"],
      additionalProperties: false,
    },
    ncmStatus: { type: "string", enum: ["preencher", "manter", "corrigir", "confirmado", "sem_sugestao"] },
    evidenciaWeb: { type: "string" },
    justificativa: { type: "string" },
  },
  required: ["categoria", "categoriaAcao", "marca", "marcaAcao", "subcategoria", "subcategoriaAcao", "ncmSugerido", "ncmStatus", "evidenciaWeb", "justificativa"],
};

type NcmCandidate = { codigo: string; descricao: string };
type WebSource = { title: string; url: string; content: string; score: number };

class TavilySearchError extends Error {
  constructor(readonly statusCode: number) {
    super(`Tavily search failed (${statusCode}).`);
  }
}

class GroqApiError extends Error {
  constructor(readonly statusCode: number) {
    super(`Groq API request failed (${statusCode}).`);
  }
}

async function buscarNaWeb(query: string): Promise<WebSource[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: query.slice(0, 390),
      search_depth: "fast",
      topic: "general",
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
      include_usage: true,
    }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new TavilySearchError(response.status);

  const result = z.object({
    results: z.array(z.object({
      title: z.string().default("Fonte da web"),
      url: z.string().url(),
      content: z.string().default(""),
      score: z.number().default(0),
    })).default([]),
  }).parse(await response.json());

  return result.results.map((item) => ({
    ...item,
    content: item.content.slice(0, 1200),
  }));
}

async function buscarNcmOficial(termo: string): Promise<NcmCandidate[]> {
  const normalized = termo.trim().slice(0, 100);
  if (normalized.length < 2) return [];

  const terms = [...new Set(
    normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((part) => part.length >= 4),
  )].slice(0, 5);
  const digits = normalized.replace(/\D/g, "");
  const formattedCode =
    digits.length === 8
      ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
      : "";
  return prisma.nCM.findMany({
    where: {
      OR: [
        { descricao: { contains: normalized, mode: "insensitive" } },
        ...terms.map((part) => ({ descricao: { contains: part, mode: "insensitive" as const } })),
        ...(digits.length >= 2
          ? [
              { codigo: { contains: digits } },
              ...(formattedCode ? [{ codigo: { contains: formattedCode } }] : []),
            ]
          : []),
      ],
    },
    select: { codigo: true, descricao: true },
    take: 10,
    orderBy: { codigo: "asc" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  if (!type || !q || q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    // 1. Busca de NCM (Autocompletar pelo código numérico)
    if (type === "ncm") {
      const results = await prisma.$queryRaw<
        Array<{ codigo: string; descricao: string }>
      >`
        SELECT codigo, descricao 
        FROM tabela_ncm
        WHERE codigo LIKE ${q + "%"}
        LIMIT 15
      `;
      return NextResponse.json(results);
    }

    // 2. Busca Dinâmica nas outras colunas
    const validFields = ["marca", "categoria", "subcategoria"];
    if (!validFields.includes(type)) return NextResponse.json([]);

    // Tipagem correta para satisfazer o Prisma e o TypeScript
    const validField = type as "marca" | "categoria" | "subcategoria";

    // Busca os valores distintos já cadastrados no banco
    const results = await prisma.produtoGlobal.findMany({
      where: {
        [validField]: {
          contains: q,
          mode: "insensitive", // Ignora maiúsculas/minúsculas
        },
        NOT: {
          [validField]: null,
        },
      },
      distinct: [validField],
      select: {
        [validField]: true,
      },
      take: 10,
    });

    // Mapeia usando um Record ao invés de 'any'
    const mapped = (results as unknown as Array<Record<string, string | null>>)
      .map((result) => result[validField])
      .filter((value): value is string => Boolean(value?.trim()));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erro na busca de sugestões:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const payload =
    typeof body === "object" && body !== null
      ? (body as { descricao?: unknown; productId?: unknown })
      : {};
  let descricao = payload.descricao;
  let codigoBarras = "";
  let valoresAtuais = { categoria: "", subcategoria: "", marca: "", ncm: "" };

  if (typeof payload.productId === "number" && Number.isInteger(payload.productId)) {
    const product = await prisma.produtoGlobal.findUnique({
      where: { id: payload.productId },
      select: {
        codigo_barras: true,
        descricao: true,
        categoria: true,
        subcategoria: true,
        marca: true,
        ncm: true,
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    descricao = product.descricao;
    codigoBarras = product.codigo_barras;
    valoresAtuais = {
      categoria: product.categoria || "",
      subcategoria: product.subcategoria || "",
      marca: product.marca || "",
      ncm: product.ncm || "",
    };
  }

  if (typeof descricao !== "string" || !descricao.trim()) {
    return NextResponse.json(
      { error: "Descrição do produto é obrigatória." },
      { status: 400 },
    );
  }
  if (descricao.trim().length > 500) {
    return NextResponse.json(
      { error: "A descrição deve ter no máximo 500 caracteres." },
      { status: 400 },
    );
  }
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não está configurada. Crie uma chave gratuita no GroqCloud e adicione ao ambiente do servidor." },
      { status: 503 },
    );
  }
  if (!process.env.TAVILY_API_KEY) {
    return NextResponse.json(
      { error: "TAVILY_API_KEY não está configurada no servidor." },
      { status: 503 },
    );
  }

  try {
    const queryWeb = [
      codigoBarras ? `"${codigoBarras}"` : "",
      descricao.trim(),
      "produto marca fabricante Brasil",
    ].filter(Boolean).join(" ");
    const [categoriasResumo, subcategoriasResumo, marcasResumo, ncmAtualOficial, candidatosEncontrados, fontesWeb, historicoRecente] = await Promise.all([
      prisma.produtoGlobal.groupBy({
        by: ["categoria"],
        where: { NOT: [{ categoria: null }, { categoria: "" }] },
        take: 100,
        orderBy: { categoria: "asc" },
      }),
      prisma.produtoGlobal.groupBy({
        by: ["categoria", "subcategoria"],
        where: { NOT: [{ subcategoria: null }, { subcategoria: "" }] },
        take: 300,
        orderBy: [{ categoria: "asc" }, { subcategoria: "asc" }],
      }),
      prisma.produtoGlobal.groupBy({
        by: ["marca"],
        where: { NOT: [{ marca: null }, { marca: "" }] },
        take: 100,
        orderBy: { marca: "asc" },
      }),
      valoresAtuais.ncm
        ? (() => {
            const currentDigits = valoresAtuais.ncm.replace(/\D/g, "");
            const formattedCurrent =
              currentDigits.length === 8
                ? `${currentDigits.slice(0, 4)}.${currentDigits.slice(4, 6)}.${currentDigits.slice(6)}`
                : currentDigits;
            return prisma.nCM.findFirst({
            where: {
              OR: [
                { codigo: valoresAtuais.ncm },
                { codigo: currentDigits },
                { codigo: formattedCurrent },
              ],
            },
            select: { codigo: true, descricao: true },
            });
          })()
        : Promise.resolve(null),
      buscarNcmOficial(descricao.trim()),
      buscarNaWeb(queryWeb),
      prisma.historicoClassificacao.findMany({
        where: {
          OR: [
            { confirmou_ncm: true },
            { confirmou_categoria: true },
            { confirmou_subcategoria: true },
            { confirmou_marca: true },
          ],
        },
        orderBy: { criado_em: "desc" },
        take: 1200,
        select: {
          produto_id: true,
          descricao: true,
          codigo_barras: true,
          ncm: true,
          categoria: true,
          subcategoria: true,
          marca: true,
          confirmou_ncm: true,
          confirmou_categoria: true,
          confirmou_subcategoria: true,
          confirmou_marca: true,
        },
      }),
    ]);
    const categorias = categoriasResumo
      .map(({ categoria }) => categoria)
      .filter((value): value is string => Boolean(value));
    const marcas = marcasResumo
      .map(({ marca }) => marca)
      .filter((value): value is string => Boolean(value));
    const subcategorias = subcategoriasResumo
      .filter(({ categoria }) => !valoresAtuais.categoria || categoria === valoresAtuais.categoria)
      .map(({ subcategoria }) => subcategoria)
      .filter((value): value is string => Boolean(value));

    const tokens = (text: string) => new Set(
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")
        .split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 3),
    );
    const productTokens = tokens(descricao.trim());
    type ProductHistory = {
      latest: (typeof historicoRecente)[number];
      ncm?: (typeof historicoRecente)[number];
      categoria?: (typeof historicoRecente)[number];
      subcategoria?: (typeof historicoRecente)[number];
      marca?: (typeof historicoRecente)[number];
    };
    const historicoPorProduto = new Map<number, ProductHistory>();
    for (const entry of historicoRecente) {
      const productHistory = historicoPorProduto.get(entry.produto_id) || { latest: entry };
      productHistory.ncm ||= entry.confirmou_ncm ? entry : undefined;
      productHistory.categoria ||= entry.confirmou_categoria ? entry : undefined;
      productHistory.subcategoria ||= entry.confirmou_subcategoria ? entry : undefined;
      productHistory.marca ||= entry.confirmou_marca ? entry : undefined;
      historicoPorProduto.set(entry.produto_id, productHistory);
    }
    const historicoUnico = [...historicoPorProduto.values()].map((history) => ({
      ...history.latest,
      ncm: history.ncm?.ncm || null,
      categoria: history.categoria?.categoria || null,
      subcategoria: history.subcategoria?.subcategoria || null,
      marca: history.marca?.marca || null,
      confirmou_ncm: Boolean(history.ncm),
      confirmou_categoria: Boolean(history.categoria),
      confirmou_subcategoria: Boolean(history.subcategoria),
      confirmou_marca: Boolean(history.marca),
    }));
    const historicoSimilar = historicoUnico
      .map((entry) => {
        const words = tokens(entry.descricao);
        const sharedWords = [...productTokens].filter((word) => words.has(word));
        const lexicalScore = sharedWords.length / Math.max(productTokens.size, 1);
        const barcodeMatch = Boolean(codigoBarras && entry.codigo_barras === codigoBarras);
        const categoryMatch = Boolean(valoresAtuais.categoria && entry.categoria === valoresAtuais.categoria);
        const subcategoryMatch = Boolean(valoresAtuais.subcategoria && entry.subcategoria === valoresAtuais.subcategoria);
        return {
          entry,
          score: lexicalScore + (categoryMatch ? 0.35 : 0) + (subcategoryMatch ? 0.5 : 0) + (barcodeMatch ? 2 : 0),
          lexicalScore,
          barcodeMatch,
          categoryMatch,
          subcategoryMatch,
        };
      })
      .filter(({ score, lexicalScore, barcodeMatch, categoryMatch, subcategoryMatch }) =>
        score >= 0.35 && (lexicalScore >= 0.2 || barcodeMatch || categoryMatch || subcategoryMatch),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    const aggregatePatterns = <T extends Record<string, string | null>>(
      items: Array<{ value: T; score: number; productId: number }>,
    ) => {
      const grouped = new Map<string, { value: T; productIds: Set<number>; score: number }>();
      for (const { value, score, productId } of items) {
        const key = JSON.stringify(value);
        const current = grouped.get(key);
        if (current) {
          current.productIds.add(productId);
          current.score = Math.max(current.score, score);
        } else {
          grouped.set(key, { value, productIds: new Set([productId]), score });
        }
      }
      return [...grouped.values()]
        .sort((a, b) => b.productIds.size - a.productIds.size || b.score - a.score)
        .map(({ value, productIds, score }) => ({
          ...value,
          ocorrencias: productIds.size,
          similaridade: Number(score.toFixed(2)),
        }));
    };
    const padroesHistorico = {
      ncm: aggregatePatterns(historicoSimilar
        .filter(({ entry }) => entry.confirmou_ncm && entry.ncm)
        .map(({ entry, score }) => ({ value: { codigo: entry.ncm, categoria: entry.categoria, subcategoria: entry.subcategoria }, score, productId: entry.produto_id }))),
      categorias: aggregatePatterns(historicoSimilar
        .filter(({ entry }) => entry.confirmou_categoria && entry.categoria)
        .map(({ entry, score }) => ({ value: { categoria: entry.categoria, subcategoria: entry.subcategoria }, score, productId: entry.produto_id }))),
      subcategorias: aggregatePatterns(historicoSimilar
        .filter(({ entry }) => entry.confirmou_subcategoria && entry.subcategoria)
        .map(({ entry, score }) => ({ value: { categoria: entry.categoria, subcategoria: entry.subcategoria }, score, productId: entry.produto_id }))),
      marcas: aggregatePatterns(historicoSimilar
        .filter(({ entry }) => entry.confirmou_marca && entry.marca)
        .map(({ entry, score }) => ({ value: { marca: entry.marca }, score, productId: entry.produto_id }))),
    };

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const candidatos = [...candidatosEncontrados];
    if (ncmAtualOficial && !candidatos.some((item) => item.codigo === ncmAtualOficial.codigo)) {
      candidatos.unshift(ncmAtualOficial);
    }
    const exemplosPorCodigo = historicoSimilar.filter(({ barcodeMatch }) => barcodeMatch).map(({ entry }) => ({ categoria: entry.categoria, subcategoria: entry.subcategoria, marca: entry.marca, ncm: entry.ncm }));
    const prompt = `Audite este produto brasileiro. Código de barras/GTIN: ${codigoBarras || "não informado"}. Descrição cadastrada: ${descricao.trim()}. Valores atuais: ${JSON.stringify(valoresAtuais)}. NCM atual na tabela oficial: ${JSON.stringify(ncmAtualOficial)}.\n\nResultados da pesquisa Tavily na internet: ${JSON.stringify(fontesWeb)}. Use os resultados para identificar produto e marca; se não houver evidência suficiente para a marca, deixe-a sem sugestão.\n\nHistórico de decisões humanas confirmadas em produtos com descrição/categoria/subcategoria semelhantes: ${JSON.stringify(padroesHistorico)}. Revisões anteriores para este mesmo código de barras: ${JSON.stringify(exemplosPorCodigo)}. Use o histórico somente como evidência auxiliar, nunca como regra ou prova. Os itens são correções confirmadas, mas podem ser exceções ou ter sido substituídos; avalie cada produto pelas características próprias e pela fonte oficial. Não copie NCM de produto parecido sem correspondência técnica.\n\nPara categoria vazia, classifique pela descrição do produto e escolha a categoria existente mais adequada desta lista: ${JSON.stringify(categorias)}. A categoria pode ser sugerida a partir da descrição; não dependa de a pesquisa web mencionar uma categoria. Se nenhuma categoria existente servir, sugira uma categoria nova, clara e curta. Quando o produto for identificável, não deixe categoria vazia e use a ação preencher. Se a categoria atual estiver preenchida e for adequada, preserve-a; só corrija com uma alternativa melhor justificada. Para subcategoria, escolha uma opção existente compatível com a categoria dentre ${JSON.stringify(subcategorias)} ou sugira uma nova quando necessário; mantenha null/sem_sugestao se não houver segurança.\n\nA lista abaixo foi consultada diretamente na tabela oficial Prisma: escolha exclusivamente um código dessa lista para sugerir; se nenhum for adequado, use null. Lista oficial: ${JSON.stringify(candidatos)}. Marcas existentes: ${JSON.stringify(marcas)}. Para marca vazia, escolha uma marca somente quando houver evidência nos resultados web ou na descrição. Preserve valores atuais corretos; sugira apenas campos vazios ou incorretos. Compare NCM atual, lista oficial e evidências web. Use confirmado, corrigir, preencher ou sem_sugestao conforme o caso. Não invente códigos. Em evidenciaWeb resuma os achados dos resultados recebidos.`;
    const groqRequestStartedAt = new Date();
    const groqStartedAtMs = Date.now();
    const modelResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Você faz auditoria conservadora de produtos brasileiros usando as evidências fornecidas. Nunca infira marca ou classificação fiscal sem evidência suficiente. Para dúvida, escolha sem_sugestao. O NCM deve ser exatamente um dos candidatos oficiais do Prisma. Responda em português.",
          },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "auditoria_produto",
            strict: true,
            schema: classificationJsonSchema,
          },
        },
        temperature: 0.1,
        reasoning_effort: "low",
        max_completion_tokens: 1800,
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const groqRequestId = modelResponse.headers.get("x-request-id") || `app_${randomUUID()}`;
    const groqDurationSeconds = (Date.now() - groqStartedAtMs) / 1000;
    if (!modelResponse.ok) {
      const errorBody: unknown = await modelResponse.json().catch(() => null);
      const parsedError = z.object({
        error: z.object({ code: z.string().optional() }).passthrough(),
      }).safeParse(errorBody);
      const errorCode = parsedError.success ? parsedError.data.error.code || null : null;
      await recordGroqUsage({
        requestId: groqRequestId,
        createdAt: groqRequestStartedAt,
        statusCode: modelResponse.status,
        model,
        timeToCompletion: groqDurationSeconds,
        errorCode,
        errorMessage: errorCode === "rate_limit_exceeded"
          ? "Limite de uso da Groq atingido."
          : `A API Groq respondeu com HTTP ${modelResponse.status}.`,
      });
      throw new GroqApiError(modelResponse.status);
    }

    const responseBody: unknown = await modelResponse.json();
    const completion = z.object({
      choices: z.array(z.object({
        message: z.object({ content: z.string().nullable() }),
      })),
      usage: z.object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
        prompt_tokens_details: z.object({ cached_tokens: z.number().optional() }).passthrough().optional(),
      }).passthrough().optional(),
    }).parse(responseBody);
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const cachedTokens = completion.usage?.prompt_tokens_details?.cached_tokens || 0;
    await recordGroqUsage({
      requestId: groqRequestId,
      createdAt: groqRequestStartedAt,
      statusCode: modelResponse.status,
      model,
      timeToCompletion: groqDurationSeconds,
      inputTokens,
      inputCachedTokens: cachedTokens,
      inputNonCachedTokens: Math.max(0, inputTokens - cachedTokens),
      outputTokens: completion.usage?.completion_tokens || 0,
    });
    const parsed = classificationSchema.parse(
      JSON.parse(completion.choices[0]?.message.content || "{}"),
    );
    const categoriaAcaoValidada =
      !valoresAtuais.categoria && parsed.categoria.trim()
        ? "preencher"
        : parsed.categoriaAcao;
    const subcategoriaAcaoValidada =
      !valoresAtuais.subcategoria && parsed.subcategoria?.trim()
        ? "preencher"
        : parsed.subcategoriaAcao;
    const match = parsed.ncmSugerido
      ? candidatos.find(
          (candidate) =>
            candidate.codigo.replace(/\D/g, "") ===
            parsed.ncmSugerido?.codigo.replace(/\D/g, ""),
        )
      : undefined;
    const ncmValido =
      match ||
      (parsed.ncmStatus === "confirmado" ? ncmAtualOficial : null);
    const ncmStatusValidado =
      ncmValido || parsed.ncmStatus === "sem_sugestao"
        ? parsed.ncmStatus
        : "sem_sugestao";

    return NextResponse.json({
      ...parsed,
      categoriaAcao: categoriaAcaoValidada,
      subcategoriaAcao: subcategoriaAcaoValidada,
      ncmSugerido: ncmValido,
      ncmStatus: ncmStatusValidado,
      alternativasNcm: candidatos,
      pesquisaWebRealizada: fontesWeb.length > 0,
      fontesWeb: fontesWeb.map(({ title, url, score }) => ({ title, url, score })),
      padroesHistorico,
      modelo: model,
    });
  } catch (error) {
    console.error("Erro ao classificar produto:", error);
    const tavilyError = error instanceof TavilySearchError ? error : null;
    const groqError = error instanceof GroqApiError ? error : null;
    const statusCode = tavilyError?.statusCode ?? groqError?.statusCode;
    const responseStatus = statusCode === 429
      ? 429
      : statusCode === 401 || statusCode === 403
        ? 503
        : tavilyError || groqError
          ? 502
          : 500;
    return NextResponse.json(
      {
        error: tavilyError
          ? tavilyError.statusCode === 401 || tavilyError.statusCode === 403
            ? "A chave da Tavily foi recusada. Confira TAVILY_API_KEY no ambiente do servidor."
            : tavilyError.statusCode === 429
              ? "O limite de buscas da Tavily foi atingido. Aguarde a renovação ou confira os créditos da conta."
              : "A busca na internet pela Tavily falhou. Confira sua conexão e tente novamente."
          : groqError
            ? groqError.statusCode === 401 || groqError.statusCode === 403
              ? "A chave da Groq foi recusada. Confira GROQ_API_KEY no ambiente do servidor."
              : groqError.statusCode === 429
                ? "O limite gratuito da Groq foi atingido. Aguarde a renovação indicada no painel da conta. Nenhuma alteração foi feita no produto."
                : "O serviço de IA da Groq não conseguiu processar a auditoria. Tente novamente em instantes."
            : "Falha ao processar a classificação do produto. Tente novamente em alguns instantes.",
      },
      { status: responseStatus },
    );
  }
}
