"use client";

import { useEffect, useState } from "react";

export default function ScrollToButtons() {
  const [showTop, setShowTop] = useState(false);

  // Fica observando a rolagem para mostrar ou esconder o botão de subir
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTop(true);
      } else {
        setShowTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight, // Pega a altura total do documento
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      {/* Botão de Subir (Só aparece se rolou para baixo) */}
      <button
        onClick={scrollToTop}
        className={`p-3 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 hover:scale-110 transition-all duration-300 ${
          showTop
            ? "opacity-70 hover:opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        title="Voltar ao Topo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      {/* Botão de Descer (Sempre visível) */}
      <button
        onClick={scrollToBottom}
        className="p-3 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 hover:scale-110 transition-all duration-300 opacity-70 hover:opacity-100"
        title="Ir para o Final"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
