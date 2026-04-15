"use client";

import { ProdutoGlobal } from "@prisma/client";
import ProductRow from "./ProductRow";

export default function ProductTable({
  produtos,
}: {
  produtos: ProdutoGlobal[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm table-fixed min-w-200">
          <thead className="bg-gray-100 border-b text-gray-600">
            <tr>
              <th className="p-4 font-semibold w-36">Cód. Barras</th>
              <th className="p-4 font-semibold w-auto">Descrição</th>
              <th className="p-4 font-semibold w-24">NCM</th>
              <th className="p-4 font-semibold w-48">Categoria</th>
              <th className="p-4 font-semibold w-32">Status</th>
              <th className="p-4 font-semibold w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <ProductRow key={produto.id} produto={produto} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
