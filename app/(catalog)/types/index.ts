export type CategoriaCount = {
  categoria: string | null;
  _count: { id: number };
};

export interface BulkPayload {
  ids?: number[];
  selectAllFilters?: {
    categoriaFiltro: string | null;
    termoBusca: string | null;
    statusFiltro?: string | null;
    marcaFiltro?: string | null;
    subcategoriaFiltro?: string | null;
    semNcm?: boolean;
    excludeIds?: number[];
  };
  categoria?: string;
  marca?: string;
  subcategoria?: string;
  ncm?: string;
}

export type ProdutoExtraido = {
  codigo_barras: string;
  descricao: string;
  ncm: string;
  marca: string;
};
