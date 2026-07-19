// app/(catalog)/page.tsx
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import CatalogHeader from "./components/CatalogHeader";
import CatalogFilters from "./components/CatalogFilters";
import ProductTable from "./components/ProductTable/ProductTable";
import PaginationControls from "./components/PaginationControls";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    page?: string;
    q?: string;
    sort?: string;
    marca?: string;
    subcategoria?: string;
    semNcm?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const categoriaFiltro = resolvedParams.categoria;
  const marcaFiltro = resolvedParams.marca;
  const subcategoriaFiltro = resolvedParams.subcategoria;
  const semNcm = resolvedParams.semNcm;
  const termoBusca = resolvedParams.q;
  const sortParam = resolvedParams.sort;
  const page = parseInt(resolvedParams.page || "1");
  const pageSize = 50;

  const conditions: Prisma.ProdutoGlobalWhereInput[] = [];

  if (categoriaFiltro === "SEM_CATEGORIA") {
    conditions.push({ OR: [{ categoria: null }, { categoria: "" }] });
  } else if (categoriaFiltro) {
    conditions.push({ categoria: categoriaFiltro });
  }

  if (marcaFiltro) {
    conditions.push({ marca: marcaFiltro });
  }

  if (subcategoriaFiltro && categoriaFiltro) {
    conditions.push({ subcategoria: subcategoriaFiltro });
  }

  if (semNcm === "true") {
    conditions.push({ OR: [{ ncm: null }, { ncm: "" }] });
  }

  if (termoBusca) {
    conditions.push({
      OR: [
        { descricao: { contains: termoBusca, mode: "insensitive" } },
        { codigo_barras: { contains: termoBusca } },
      ],
    });
  }

  const where: Prisma.ProdutoGlobalWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const orderByQuery: Prisma.ProdutoGlobalOrderByWithRelationInput =
    sortParam === "asc"
      ? { codigo_barras: "asc" }
      : sortParam === "desc"
        ? { codigo_barras: "desc" }
        : { created_at: "desc" };

  const hasCategoriaSelected = !!categoriaFiltro;

  type SubcategoriaGroup = {
    subcategoria: string | null;
    _count: { id: number };
  };

  const subcategoriaFilterConditions: Prisma.ProdutoGlobalWhereInput[] = [
    { NOT: [{ subcategoria: null }, { subcategoria: "" }] },
  ];

  if (categoriaFiltro === "SEM_CATEGORIA") {
    subcategoriaFilterConditions.push({
      OR: [{ categoria: null }, { categoria: "" }],
    });
  } else if (categoriaFiltro) {
    subcategoriaFilterConditions.push({ categoria: categoriaFiltro });
  }

  const subcategoriasQuery: Promise<SubcategoriaGroup[]> = hasCategoriaSelected
    ? (prisma.produtoGlobal.groupBy({
        by: ["subcategoria"],
        where: { AND: subcategoriaFilterConditions },
        _count: { id: true },
        orderBy: { subcategoria: "asc" },
      }) as unknown as Promise<SubcategoriaGroup[]>)
    : Promise.resolve([] as SubcategoriaGroup[]);

  const [
    categoriasResumo,
    marcasResumo,
    subcategoriasResumo,
    totalItens,
    produtos,
  ] = await Promise.all([
    prisma.produtoGlobal.groupBy({
      by: ["categoria"],
      _count: { id: true },
      orderBy: { categoria: "asc" },
    }),
    prisma.produtoGlobal.groupBy({
      by: ["marca"],
      where: { NOT: [{ marca: null }, { marca: "" }] },
      _count: { id: true },
      orderBy: { marca: "asc" },
    }),
    subcategoriasQuery,
    prisma.produtoGlobal.count({ where }),
    prisma.produtoGlobal.findMany({
      where,
      orderBy: orderByQuery,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalItens / pageSize);

  const categoriasOptions = categoriasResumo
    .map((c) => ({
      value: c.categoria || "SEM_CATEGORIA",
      label: c.categoria || "Sem Categoria",
      count: c._count.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const marcasOptions = marcasResumo.map((m) => ({
    value: m.marca!,
    label: m.marca!,
    count: m._count.id,
  }));

  const subcategoriasOptions = subcategoriasResumo.map((s) => ({
    value: s.subcategoria!,
    label: s.subcategoria!,
    count: s._count.id,
  }));

  return (
    <main
      className="bg-slate-100 p-4 relative h-full min-h-0 overflow-hidden grid gap-3"
      style={{
        gridTemplateRows: "auto auto minmax(0, 1fr)",
      }}
    >
      <CatalogHeader totalItens={totalItens} />

      <CatalogFilters
        key={JSON.stringify(resolvedParams)}
        categorias={categoriasOptions}
        marcas={marcasOptions}
        subcategorias={subcategoriasOptions}
      />

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-2 flex justify-between items-center shrink-0">
          <PaginationControls currentPage={page} totalPages={totalPages} />
        </div>

        <ProductTable
          produtos={produtos}
          totalItemsEncontrados={totalItens}
          categoriaFiltro={categoriaFiltro}
          termoBusca={termoBusca}
          currentSort={sortParam}
        />

        <div className="px-4 py-2 flex justify-center sm:justify-end shrink-0 border-t border-slate-100">
          <PaginationControls currentPage={page} totalPages={totalPages} />
        </div>
      </section>
    </main>
  );
}
