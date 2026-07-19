import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo Global",
  description: "Gestão de Base Mestra de Produtos",
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
