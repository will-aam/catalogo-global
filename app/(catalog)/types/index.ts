export type CategoriaCount = {
  categoria: string | null;
  _count: { id: number };
};

export type BulkPayload = {
  categoria?: string;
  marca?: string;
  ids?: number[];
  selectAllFilters?: {
    categoriaFiltro: string | null;
    termoBusca: string | null;
  };
};

export type ProdutoExtraido = {
  codigo_barras: string;
  descricao: string;
  ncm: string;
  marca: string;
};
