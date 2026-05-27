"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function XMLUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [marca, setMarca] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Transforma a lista do Windows em um Array do JavaScript
    const files = Array.from(fileList);

    // Filtro de segurança: pega apenas os que terminam em .xml
    const xmlFiles = files.filter((f) => f.name.toLowerCase().endsWith(".xml"));

    if (xmlFiles.length === 0) {
      alert("Nenhum arquivo XML válido selecionado.");
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: xmlFiles.length });

    let totalCriados = 0;
    let totalAtualizados = 0;

    // A MÁGICA: O tamanho do lote! 50 é o número de ouro para não estourar a memória.
    const BATCH_SIZE = 50;

    try {
      for (let i = 0; i < xmlFiles.length; i += BATCH_SIZE) {
        // Pega uma fatia de 50 notas
        const chunk = xmlFiles.slice(i, i + BATCH_SIZE);
        const formData = new FormData();

        // Empacota as 50 notas
        chunk.forEach((file) => formData.append("files", file));

        // Se você digitou a marca, empacota junto
        if (marca.trim()) {
          formData.append("marca", marca.trim());
        }

        // Manda o pacote e espera o servidor responder
        const res = await fetch("/api/import-xml", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          totalCriados += data.criados || 0;
          totalAtualizados += data.atualizados || 0;
        } else {
          console.error(`Erro no lote ${i}:`, data.error);
          // O sistema ignora o erro deste lote e continua para os próximos!
        }

        // Atualiza a tela com a quantidade processada até agora
        setProgress({
          current: Math.min(i + BATCH_SIZE, xmlFiles.length),
          total: xmlFiles.length,
        });
      }

      alert(
        `Importação em Lote Concluída com Sucesso!\n\nNotas lidas: ${xmlFiles.length}\nNovos produtos inseridos: ${totalCriados}\nProdutos atualizados com NCM/Marca: ${totalAtualizados}`,
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro na conexão durante o envio do lote.");
    } finally {
      setIsUploading(false);
      setMarca(""); // Limpa o campo da marca para o próximo lote
      setProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Campo para a Marca */}
      <input
        type="text"
        placeholder="Marca (opcional)"
        value={marca}
        onChange={(e) => setMarca(e.target.value)}
        disabled={isUploading}
        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-orange-500 w-36 bg-white disabled:bg-slate-100 placeholder:text-slate-400"
        title="Se preenchido, os produtos herdaram esta marca"
      />

      {/* O Input de arquivo oculto com o 'multiple' ativado */}
      <input
        type="file"
        accept=".xml"
        multiple
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-1.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap min-w-[180px]"
        title="Selecione dezenas ou centenas de XMLs de uma vez"
      >
        {isUploading
          ? `⏳ Processando ${progress.current} / ${progress.total}`
          : "🧾 Importar Lote XML"}
      </button>
    </div>
  );
}
