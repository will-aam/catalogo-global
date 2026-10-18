import { OrigemClassificacao, Prisma } from "@prisma/client";

type ClassificationSnapshot = {
  id: number;
  codigo_barras: string;
  descricao: string;
  ncm: string | null;
  categoria: string | null;
  subcategoria: string | null;
  marca: string | null;
};

export type ClassificationSuggestions = Partial<
  Pick<ClassificationSnapshot, "ncm" | "categoria" | "subcategoria" | "marca">
>;

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

function sameValue(left: string | null | undefined, right: string | null | undefined) {
  return (clean(left) || "").toLocaleLowerCase("pt-BR") ===
    (clean(right) || "").toLocaleLowerCase("pt-BR");
}

function sameNcm(left: string | null | undefined, right: string | null | undefined) {
  return (left || "").replace(/\D/g, "") === (right || "").replace(/\D/g, "");
}

export function buildClassificationHistoryRecord(
  before: ClassificationSnapshot,
  after: ClassificationSnapshot,
  origem: OrigemClassificacao,
  sugestoes: ClassificationSuggestions = {},
  includeWithoutConfirmedChanges = false,
) {
  const confirmouNcm =
    !sameNcm(before.ncm, after.ncm) ||
    (origem === "IA" && Boolean(clean(sugestoes.ncm)) && sameNcm(sugestoes.ncm, after.ncm));
  const confirmouCategoria =
    !sameValue(before.categoria, after.categoria) ||
    (origem === "IA" && Boolean(clean(sugestoes.categoria)) && sameValue(sugestoes.categoria, after.categoria));
  const confirmouSubcategoria =
    !sameValue(before.subcategoria, after.subcategoria) ||
    (origem === "IA" && Boolean(clean(sugestoes.subcategoria)) && sameValue(sugestoes.subcategoria, after.subcategoria));
  const confirmouMarca =
    !sameValue(before.marca, after.marca) ||
    (origem === "IA" && Boolean(clean(sugestoes.marca)) && sameValue(sugestoes.marca, after.marca));

  if (
    !confirmouNcm &&
    !confirmouCategoria &&
    !confirmouSubcategoria &&
    !confirmouMarca &&
    !includeWithoutConfirmedChanges
  ) {
    return null;
  }

  return {
    produto_id: after.id,
    codigo_barras: after.codigo_barras,
    descricao: after.descricao,
    origem,
    ncm_anterior: before.ncm,
    categoria_anterior: before.categoria,
    subcategoria_anterior: before.subcategoria,
    marca_anterior: before.marca,
    ncm: after.ncm,
    categoria: after.categoria,
    subcategoria: after.subcategoria,
    marca: after.marca,
    confirmou_ncm: confirmouNcm,
    confirmou_categoria: confirmouCategoria,
    confirmou_subcategoria: confirmouSubcategoria,
    confirmou_marca: confirmouMarca,
  } satisfies Prisma.HistoricoClassificacaoCreateManyInput;
}

export async function recordClassificationHistory(
  tx: Prisma.TransactionClient,
  before: ClassificationSnapshot,
  after: ClassificationSnapshot,
  origem: OrigemClassificacao,
  sugestoes: ClassificationSuggestions = {},
  includeWithoutConfirmedChanges = false,
) {
  const data = buildClassificationHistoryRecord(
    before,
    after,
    origem,
    sugestoes,
    includeWithoutConfirmedChanges,
  );
  if (data) await tx.historicoClassificacao.create({ data });
}

