-- CreateEnum
CREATE TYPE "StatusAuditoria" AS ENUM ('PENDENTE', 'REVISADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "produtos_globais" (
    "id" SERIAL NOT NULL,
    "codigo_barras" TEXT NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "ncm" VARCHAR(10),
    "categoria" VARCHAR(100),
    "marca" VARCHAR(100),
    "origem_dado" VARCHAR(100),
    "status_auditoria" "StatusAuditoria" NOT NULL DEFAULT 'PENDENTE',
    "notas_internas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_globais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_globais_codigo_barras_key" ON "produtos_globais"("codigo_barras");

-- CreateIndex
CREATE INDEX "produtos_globais_categoria_idx" ON "produtos_globais"("categoria");

-- CreateIndex
CREATE INDEX "produtos_globais_status_auditoria_idx" ON "produtos_globais"("status_auditoria");
