import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    // O export da Groq usa aspas escapadas com barra invertida no campo JSON.
    if (quoted && char === "\\" && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  fields.push(value);
  return fields;
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function safeError(errorText, statusCode) {
  if (!errorText) return { errorCode: null, errorMessage: null };
  let code = null;
  try {
    const parsed = JSON.parse(errorText);
    code = typeof parsed.code === "string" ? parsed.code : null;
  } catch {
    // Não persiste texto bruto do provedor, pois pode carregar IDs internos.
  }

  const message = code === "rate_limit_exceeded"
    ? "Limite de uso da Groq atingido."
    : `A API Groq respondeu com HTTP ${statusCode}.`;
  return { errorCode: code, errorMessage: message };
}

const dryRun = process.argv[2] === "--dry-run";
const sqlOnly = process.argv[2] === "--sql-only";
const filePath = process.argv[dryRun || sqlOnly ? 3 : 2];
if (!filePath) {
  console.error("Uso: node --env-file=.env scripts/import-groq-logs.mjs [--dry-run|--sql-only] <arquivo.csv> [arquivo.sql]");
  process.exitCode = 1;
} else {
  const csv = await readFile(resolve(filePath), "utf8");
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const records = [];

  for (const line of lines) {
    const fields = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? ""]));
    const timestamp = Number(row.created_at);
    const statusCode = Number(row.status_code);
    if (!row.request_id || !Number.isFinite(timestamp) || !Number.isInteger(statusCode)) {
      throw new Error("O CSV contém uma linha sem identificador, data ou status válido.");
    }

    const failure = safeError(row.error, statusCode);
    const inputTokens = numberOrZero(row.input_tokens);
    const cachedTokens = numberOrZero(row.input_cached_tokens);
    records.push({
      requestId: row.request_id,
      createdAt: new Date(timestamp),
      statusCode,
      model: row.model || "desconhecido",
      timeToFirstToken: numberOrZero(row.time_to_first_token),
      timeToCompletion: numberOrZero(row.time_to_completion),
      inputTokens,
      inputNonCachedTokens: Math.max(0, numberOrZero(row.input_non_cached_tokens) || inputTokens - cachedTokens),
      inputCachedTokens: cachedTokens,
      inputAudioSeconds: numberOrZero(row.input_audio_seconds),
      outputTokens: numberOrZero(row.output_tokens),
      ...failure,
      origin: "IMPORTACAO",
    });
  }

  const report = {
    rowsInCsv: records.length,
    successes: records.filter((record) => record.statusCode >= 200 && record.statusCode < 300).length,
    rateLimited: records.filter((record) => record.statusCode === 429).length,
    inputTokens: records.reduce((total, record) => total + record.inputTokens, 0),
    outputTokens: records.reduce((total, record) => total + record.outputTokens, 0),
  };

  if (sqlOnly) {
    const outputPath = process.argv[4];
    if (!outputPath) throw new Error("Informe o caminho de saída do arquivo SQL.");
    const quote = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
    const timestamp = (value) => quote(value.toISOString().replace("T", " ").replace("Z", ""));
    const sqlValues = records.map((record) => `(${[
      quote(record.requestId),
      timestamp(record.createdAt),
      record.statusCode,
      quote(record.model),
      record.timeToFirstToken ?? "NULL",
      record.timeToCompletion ?? "NULL",
      record.inputTokens,
      record.inputNonCachedTokens,
      record.inputCachedTokens,
      record.inputAudioSeconds,
      record.outputTokens,
      quote(record.errorCode),
      quote(record.errorMessage),
      quote(record.origin),
    ].join(", ")})`).join(",\n");
    const sql = `INSERT INTO "groq_api_usage" ("request_id", "created_at", "status_code", "model", "time_to_first_token", "time_to_completion", "input_tokens", "input_non_cached_tokens", "input_cached_tokens", "input_audio_seconds", "output_tokens", "error_code", "error_message", "origin")\nVALUES\n${sqlValues}\nON CONFLICT ("request_id") DO NOTHING;\n`;
    await writeFile(resolve(outputPath), sql, "utf8");
    console.log(JSON.stringify({ ...report, sqlFile: resolve(outputPath) }, null, 2));
  } else if (dryRun) {
    console.log(JSON.stringify({ ...report, dryRun: true }, null, 2));
  } else {
    const prisma = new PrismaClient();
    try {
      const result = await prisma.groqRequestLog.createMany({
        data: records,
        skipDuplicates: true,
      });
      console.log(JSON.stringify({
        ...report,
        imported: result.count,
        duplicatesSkipped: records.length - result.count,
      }, null, 2));
    } finally {
      await prisma.$disconnect();
    }
  }
}
