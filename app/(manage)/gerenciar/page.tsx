import { prisma } from "@/lib/prisma";
import ManageContent from "./components/ManageContent";
import type { ManagedItem, SubcategoriaTree } from "./types";

export const dynamic = "force-dynamic";

export default async function GerenciarPage() {
  const [categoriasResumo, subcategoriasResumo, marcasResumo] =
    await Promise.all([
      prisma.produtoGlobal.groupBy({
        by: ["categoria"],
        _count: { id: true },
        orderBy: { categoria: "asc" },
      }),
      prisma.produtoGlobal.groupBy({
        by: ["categoria", "subcategoria"],
        where: { NOT: [{ subcategoria: null }, { subcategoria: "" }] },
        _count: { id: true },
        orderBy: [{ categoria: "asc" }, { subcategoria: "asc" }],
      }),
      prisma.produtoGlobal.groupBy({
        by: ["marca"],
        where: { NOT: [{ marca: null }, { marca: "" }] },
        _count: { id: true },
        orderBy: { marca: "asc" },
      }),
    ]);

  const categorias: ManagedItem[] = categoriasResumo.map((c) => ({
    name: c.categoria || "Sem Categoria",
    count: c._count.id,
  }));

  const subcategoriaTree: SubcategoriaTree[] = subcategoriasResumo.reduce<
    SubcategoriaTree[]
  >((acc, row) => {
    const catName = row.categoria || "Sem Categoria";
    const subName = row.subcategoria!;

    let catGroup = acc.find((g) => g.categoria === catName);
    if (!catGroup) {
      catGroup = { categoria: catName, subcategorias: [] };
      acc.push(catGroup);
    }

    catGroup.subcategorias.push({
      name: subName,
      count: row._count.id,
    });

    return acc;
  }, []);

  const marcas: ManagedItem[] = marcasResumo.map((m) => ({
    name: m.marca!,
    count: m._count.id,
  }));

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
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
            className="text-blue-600"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Gerenciar Categorias, Subcategorias e Marcas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Renomeie, mesclare e organize seus dados em massa. Clique em qualquer
          nome para renomeá-lo.
        </p>
      </div>

      <ManageContent
        categorias={categorias}
        subcategoriaTree={subcategoriaTree}
        marcas={marcas}
        categoriaCount={categorias.length}
        subcategoriaCount={subcategoriasResumo.length}
        marcaCount={marcas.length}
      />
    </>
  );
}
