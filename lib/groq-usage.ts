import { OrigemLogIA, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type GroqUsageInput = {
  requestId: string;
  createdAt?: Date;
  statusCode: number;
  model: string;
  timeToFirstToken?: number | null;
  timeToCompletion?: number | null;
  inputTokens?: number;
  inputNonCachedTokens?: number;
  inputCachedTokens?: number;
  inputAudioSeconds?: number;
  outputTokens?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  origin?: OrigemLogIA;
};

export async function recordGroqUsage(input: GroqUsageInput) {
  const data: Prisma.GroqRequestLogUncheckedCreateInput = {
    requestId: input.requestId,
    createdAt: input.createdAt || new Date(),
    statusCode: input.statusCode,
    model: input.model,
    timeToFirstToken: input.timeToFirstToken,
    timeToCompletion: input.timeToCompletion,
    inputTokens: input.inputTokens || 0,
    inputNonCachedTokens: input.inputNonCachedTokens || 0,
    inputCachedTokens: input.inputCachedTokens || 0,
    inputAudioSeconds: input.inputAudioSeconds || 0,
    outputTokens: input.outputTokens || 0,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    origin: input.origin || OrigemLogIA.SISTEMA,
  };

  try {
    await prisma.groqRequestLog.upsert({
      where: { requestId: data.requestId },
      create: data,
      update: {
        statusCode: data.statusCode,
        timeToFirstToken: data.timeToFirstToken,
        timeToCompletion: data.timeToCompletion,
        inputTokens: data.inputTokens,
        inputNonCachedTokens: data.inputNonCachedTokens,
        inputCachedTokens: data.inputCachedTokens,
        outputTokens: data.outputTokens,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    // Falha de telemetria não deve interromper a sugestão do produto.
    console.error("Não foi possível registrar o uso da Groq:", error);
  }
}
