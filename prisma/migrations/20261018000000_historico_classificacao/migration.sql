-- Histórico de correções confirmadas usado como evidência para sugestões futuras.
ALTER TABLE "produtos_globais" ADD COLUMN IF NOT EXISTS "subcategoria" VARCHAR(100);
CREATE INDEX IF NOT EXISTS "produtos_globais_subcategoria_idx" ON "produtos_globais"("subcategoria");

CREATE TABLE IF NOT EXISTS "tabela_ncm" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tabela_ncm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tabela_ncm_codigo_key" ON "tabela_ncm"("codigo");
CREATE INDEX IF NOT EXISTS "tabela_ncm_codigo_idx" ON "tabela_ncm"("codigo");
CREATE INDEX IF NOT EXISTS "tabela_ncm_descricao_idx" ON "tabela_ncm"("descricao");

CREATE TYPE "OrigemClassificacao" AS ENUM ('MANUAL', 'IA', 'LOTE');

CREATE TABLE "historico_classificacao" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "codigo_barras" TEXT NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "origem" "OrigemClassificacao" NOT NULL,
    "ncm_anterior" VARCHAR(10),
    "categoria_anterior" VARCHAR(100),
    "subcategoria_anterior" VARCHAR(100),
    "marca_anterior" VARCHAR(100),
    "ncm" VARCHAR(10),
    "categoria" VARCHAR(100),
    "subcategoria" VARCHAR(100),
    "marca" VARCHAR(100),
    "confirmou_ncm" BOOLEAN NOT NULL DEFAULT false,
    "confirmou_categoria" BOOLEAN NOT NULL DEFAULT false,
    "confirmou_subcategoria" BOOLEAN NOT NULL DEFAULT false,
    "confirmou_marca" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_classificacao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "historico_classificacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos_globais"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "historico_classificacao_produto_id_criado_em_idx" ON "historico_classificacao"("produto_id", "criado_em");
CREATE INDEX "historico_classificacao_criado_em_idx" ON "historico_classificacao"("criado_em");
