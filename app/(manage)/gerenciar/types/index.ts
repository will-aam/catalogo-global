export type ManagedItem = {
  name: string;
  count: number;
};

export type SubcategoriaTree = {
  categoria: string;
  subcategorias: ManagedItem[];
};
