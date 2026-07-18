"use client";

import { useState } from "react";
import ManageTabs from "./ManageTabs";
import CategoryManager from "./CategoryManager";
import SubcategoryManager from "./SubcategoryManager";
import BrandManager from "./BrandManager";
import type { ManagedItem, SubcategoriaTree } from "../types";

type ManageContentProps = {
  categorias: ManagedItem[];
  subcategoriaTree: SubcategoriaTree[];
  marcas: ManagedItem[];
  categoriaCount: number;
  subcategoriaCount: number;
  marcaCount: number;
};

export default function ManageContent({
  categorias,
  subcategoriaTree,
  marcas,
  categoriaCount,
  subcategoriaCount,
  marcaCount,
}: ManageContentProps) {
  const [activeTab, setActiveTab] = useState("categorias");

  const tabs = [
    {
      id: "categorias",
      label: "Categorias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      count: categoriaCount,
    },
    {
      id: "subcategorias",
      label: "Subcategorias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      count: subcategoriaCount,
    },
    {
      id: "marcas",
      label: "Marcas",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12l4 6-10 13L2 9Z" />
        </svg>
      ),
      count: marcaCount,
    },
  ];

  return (
    <div className="space-y-4">
      <ManageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        {activeTab === "categorias" && (
          <CategoryManager categorias={categorias} />
        )}
        {activeTab === "subcategorias" && (
          <SubcategoryManager
            subcategoriaTree={subcategoriaTree}
            categorias={categorias}
          />
        )}
        {activeTab === "marcas" && <BrandManager marcas={marcas} />}
      </div>
    </div>
  );
}
