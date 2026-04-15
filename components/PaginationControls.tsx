"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PaginationControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    // Preserva os filtros atuais (ex: categoria) e só muda a página
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-4 border-t bg-gray-50">
      <div className="text-sm text-gray-500">
        Página{" "}
        <span className="font-semibold text-gray-900">{currentPage}</span> de{" "}
        <span className="font-semibold text-gray-900">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          Anterior
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
