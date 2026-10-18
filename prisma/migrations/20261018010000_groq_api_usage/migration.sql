CREATE TYPE "OrigemLogIA" AS ENUM ('IMPORTACAO', 'SISTEMA');

CREATE TABLE "groq_api_usage" (
    "id" SERIAL NOT NULL,
    "request_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "time_to_first_token" DOUBLE PRECISION,
    "time_to_completion" DOUBLE PRECISION,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "input_non_cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "input_cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "input_audio_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "error_code" VARCHAR(120),
    "error_message" VARCHAR(500),
    "origin" "OrigemLogIA" NOT NULL DEFAULT 'SISTEMA',

    CONSTRAINT "groq_api_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "groq_api_usage_request_id_key" ON "groq_api_usage"("request_id");
CREATE INDEX "groq_api_usage_created_at_idx" ON "groq_api_usage"("created_at");
CREATE INDEX "groq_api_usage_status_code_created_at_idx" ON "groq_api_usage"("status_code", "created_at");
