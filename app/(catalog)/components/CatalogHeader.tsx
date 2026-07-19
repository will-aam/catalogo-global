import UploadButton from "./import/UploadButton";
import XMLUploadButton from "./import/XMLUploadButton";
import PDFUploadButton from "./import/PDFUploadButton";

export default function CatalogHeader({ totalItens }: { totalItens: number }) {
  return (
    <header className="relative z-50 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
      {/* Título */}
      <div className="w-full lg:w-auto flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            Catálogo Global
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
            Gestão de Base Mestra
          </p>
        </div>

        {/* Contador Visível apenas no Mobile */}
        <div className="lg:hidden bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-center">
          <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest">
            Itens
          </span>
          <span className="block text-sm font-black text-blue-700 leading-none mt-0.5">
            {totalItens}
          </span>
        </div>
      </div>

      {/* Contador Desktop + Ações */}
      <div className="w-full lg:w-auto flex items-center justify-end gap-3 shrink-0">
        {/* Contador Visível apenas no Desktop */}
        <div className="hidden lg:flex bg-blue-50/50 px-4 py-1.5 rounded-lg border border-blue-100 flex-col items-center">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
            Encontrados
          </span>
          <span className="text-lg font-black text-blue-700 leading-none mt-0.5">
            {totalItens}
          </span>
        </div>
        {/* Dropdown de Importação */}
        <div className="relative group w-full lg:w-auto">
          <button className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none">
            Importar Dados
            <svg
              className="w-4 h-4 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div className="absolute right-0 top-full pt-2 w-full lg:w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col p-2 gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Formatos
              </span>
              <UploadButton />
              <XMLUploadButton />
              <PDFUploadButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
