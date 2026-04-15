"use client";

import { useRouter, useSearchParams } from "next/navigation";

type CategoriaCount = {
  categoria: string | null;
  _count: { id: number };
};

export default function CategorySidebar({
  categorias,
}: {
  categorias: CategoriaCount[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaAtual = searchParams.get("categoria");

  const handleFilter = (cat: string | null) => {
    if (!cat) {
      router.push("/"); // Limpa o filtro
    } else {
      router.push(`/?categoria=${encodeURIComponent(cat)}`); // Aplica o filtro
    }
  };

  return (
    <aside className="w-full md:w-64 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="font-semibold text-gray-800">Categorias</h2>
      </div>
      <div className="p-2 overflow-y-auto max-h-[60vh] md:max-h-none">
        <button
          onClick={() => handleFilter(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            !categoriaAtual
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Todas as Categorias
        </button>

        {categorias.map((cat, index) => {
          const nome = cat.categoria || "Sem Categoria";
          const isActive = categoriaAtual === cat.categoria;

          return (
            <button
              key={index}
              onClick={() => handleFilter(cat.categoria)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="truncate pr-2">{nome}</span>
              <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                {cat._count.id}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
