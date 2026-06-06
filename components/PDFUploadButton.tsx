"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type ProdutoExtraido = {
  codigo_barras: string;
  descricao: string;
  ncm: string;
  marca: string;
};

export default function PDFUploadButton() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [produtosTriagem, setProdutosTriagem] = useState<ProdutoExtraido[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Campos para aplicação em massa no Modal
  const [bulkMarca, setBulkMarca] = useState("");
  const [bulkNcm, setBulkNcm] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Por favor, selecione um ficheiro PDF válido.");
      return;
    }

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.produtos) {
        setProdutosTriagem(data.produtos);
        setShowModal(true); // Abre o ecrã de triagem
      } else {
        alert(`Erro: ${data.error || "Falha ao extrair dados do PDF"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de ligação ao enviar o PDF.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyBulk = () => {
    // Aplica a marca e o NCM digitados a todos os produtos da lista de triagem
    const atualizados = produtosTriagem.map((p) => ({
      ...p,
      marca: bulkMarca || p.marca,
      ncm: bulkNcm || p.ncm,
    }));
    setProdutosTriagem(atualizados);
    alert("Marca/NCM aplicados à lista com sucesso!");
  };

  const handleRemoveItem = (index: number) => {
    const novaLista = [...produtosTriagem];
    novaLista.splice(index, 1);
    setProdutosTriagem(novaLista);
  };

  const handleSaveToDatabase = async () => {
    if (produtosTriagem.length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/import-pdf-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtos: produtosTriagem }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Sucesso!\nNovos: ${data.criados}\nAtualizados: ${data.atualizados}`,
        );
        setShowModal(false);
        setProdutosTriagem([]);
        setBulkMarca("");
        setBulkNcm("");
        router.refresh();
      } else {
        alert("Erro ao guardar os produtos na base de dados.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de ligação ao guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isExtracting}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          title="Extrair produtos de Catálogos em PDF"
        >
          {isExtracting ? "A ler PDF..." : "Importar PDF"}
        </button>
      </div>

      {/* O ECRÃ DE TRIAGEM (MODAL) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  Triagem de PDF
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {produtosTriagem.length} produtos extraídos. Reveja antes de
                  inserir na base de dados.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Fechar sem guardar"
              >
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
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Barra de Ferramentas em Massa */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Aplicar Marca a Todos
                </label>
                <input
                  type="text"
                  value={bulkMarca}
                  onChange={(e) => setBulkMarca(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                  placeholder="Ex: Danone"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Aplicar NCM a Todos
                </label>
                <input
                  type="text"
                  value={bulkNcm}
                  onChange={(e) => setBulkNcm(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                  placeholder="Ex: 19011090"
                />
              </div>
              <button
                onClick={handleApplyBulk}
                className="px-4 py-1.5 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors border border-blue-300"
              >
                Aplicar à Lista
              </button>
            </div>

            {/* Tabela de Revisão */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4">
              <table className="w-full text-left text-sm bg-white border border-slate-200 rounded-lg shadow-sm">
                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 shadow-sm text-slate-600">
                  <tr>
                    <th className="p-3 font-semibold">Cód. Barras</th>
                    <th className="p-3 font-semibold">Descrição Extraída</th>
                    <th className="p-3 font-semibold w-32">Marca</th>
                    <th className="p-3 font-semibold w-32">NCM</th>
                    <th className="p-3 font-semibold w-16 text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produtosTriagem.map((prod, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-700">
                        {prod.codigo_barras}
                      </td>
                      <td className="p-3 text-slate-600">{prod.descricao}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={prod.marca}
                          onChange={(e) => {
                            const novaLista = [...produtosTriagem];
                            novaLista[index].marca = e.target.value;
                            setProdutosTriagem(novaLista);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={prod.ncm}
                          onChange={(e) => {
                            const novaLista = [...produtosTriagem];
                            novaLista[index].ncm = e.target.value;
                            setProdutosTriagem(novaLista);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-600 font-bold"
                          title="Ignorar este item"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || produtosTriagem.length === 0}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
              >
                {isSaving
                  ? "A Guardar..."
                  : `Guardar ${produtosTriagem.length} Produtos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
