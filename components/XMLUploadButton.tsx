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

    const files = Array.from(fileList);
    const xmlFiles = files.filter((f) => f.name.toLowerCase().endsWith(".xml"));

    if (xmlFiles.length === 0) {
      alert("Nenhum arquivo XML válido selecionado.");
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: xmlFiles.length });

    let totalCriados = 0;
    let totalAtualizados = 0;
    const BATCH_SIZE = 50;

    try {
      for (let i = 0; i < xmlFiles.length; i += BATCH_SIZE) {
        const chunk = xmlFiles.slice(i, i + BATCH_SIZE);
        const formData = new FormData();

        chunk.forEach((file) => formData.append("files", file));

        if (marca.trim()) {
          formData.append("marca", marca.trim());
        }

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
        }

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
      setMarca("");
      setProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    // Transformei de flex-row para flex-col, ocupando 100% da largura (w-full)
    <div className="flex flex-col w-full gap-2 bg-orange-50/50 p-2 border border-orange-100 rounded-lg">
      {/* Campo para a Marca (Agora ocupa 100% do espaço) */}
      <input
        type="text"
        placeholder="Definir Marca (opcional)"
        value={marca}
        onChange={(e) => setMarca(e.target.value)}
        disabled={isUploading}
        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-orange-500 bg-white disabled:bg-slate-100 placeholder:text-slate-400"
        title="Se preenchido, os produtos herdaram esta marca"
      />

      <input
        type="file"
        accept=".xml"
        multiple
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      {/* Botão (Agora ocupa 100% do espaço) */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full px-3 py-2 bg-orange-500 text-white rounded-md font-medium text-xs hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        title="Selecione dezenas ou centenas de XMLs de uma vez"
      >
        {isUploading
          ? `⏳ ${progress.current} / ${progress.total}`
          : "Importar XMLs"}
      </button>
    </div>
  );
}
