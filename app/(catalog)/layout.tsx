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
  return <div className="flex-1 flex flex-col">{children}</div>;
}
