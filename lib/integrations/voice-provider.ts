import { AppError } from "@/lib/api/errors";
import { providerPost } from "@/lib/integrations/provider-http";

export type VoiceIntent = "create_payment" | "capture_payment" | "refund_payment" | "unknown";

export type VoiceNluResult = {
  intent: VoiceIntent;
  confidence: number;
  entities: {
    amount?: number;
    currency?: string;
    paymentId?: string;
    customerId?: string;
    reason?: string;
  };
  rawText: string;
};

export async function transcribeVoiceWithProvider(input: {
  audioUrl?: string;
  audioBase64?: string;
  transcriptHint?: string;
}) {
  const baseUrl = process.env.NEXTPAY_ASR_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_ASR_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<
      { audioUrl?: string; audioBase64?: string; transcriptHint?: string },
      { transcript?: string; language?: string }
    >(`${baseUrl}/asr/transcribe`, apiKey, input);

    if (!result.transcript) {
      throw new AppError(502, "asr_provider_invalid_response");
    }

    return {
      transcript: result.transcript,
      language: result.language ?? "en"
    };
  }

  if (input.transcriptHint) {
    return {
      transcript: input.transcriptHint,
      language: "en"
    };
  }

  throw new AppError(400, "voice_transcript_required_without_asr_provider");
}

function parseMinorAmount(raw: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

function fallbackInterpret(transcript: string): VoiceNluResult {
  const normalized = transcript.trim().toLowerCase();

  const createMatch = normalized.match(
    /(pay|charge|create)(?:\s+payment)?\s+(\d+(?:\.\d{1,2})?)\s*([a-z]{3})?(?:.*customer\s+([a-f0-9-]{8,}))?/
  );
  if (createMatch) {
    const amount = parseMinorAmount(createMatch[2]);
    if (amount) {
      return {
        intent: "create_payment",
        confidence: 0.7,
        entities: {
          amount,
          currency: (createMatch[3] ?? "USD").toUpperCase(),
          customerId: createMatch[4] ?? undefined
        },
        rawText: transcript
      };
    }
  }

  const captureMatch = normalized.match(/(capture|confirm)(?:\s+payment)?\s+([a-f0-9-]{8,})/);
  if (captureMatch) {
    return {
      intent: "capture_payment",
      confidence: 0.78,
      entities: {
        paymentId: captureMatch[2]
      },
      rawText: transcript
    };
  }

  const refundMatch = normalized.match(
    /refund(?:\s+payment)?\s+([a-f0-9-]{8,})\s+(\d+(?:\.\d{1,2})?)\s*([a-z]{3})?(?:\s+for\s+(.+))?/
  );
  if (refundMatch) {
    const amount = parseMinorAmount(refundMatch[2]);
    if (amount) {
      return {
        intent: "refund_payment",
        confidence: 0.74,
        entities: {
          paymentId: refundMatch[1],
          amount,
          currency: (refundMatch[3] ?? "USD").toUpperCase(),
          reason: refundMatch[4]?.trim() || undefined
        },
        rawText: transcript
      };
    }
  }

  return {
    intent: "unknown",
    confidence: 0.25,
    entities: {},
    rawText: transcript
  };
}

export async function interpretVoiceCommand(input: { transcript: string }) {
  const baseUrl = process.env.NEXTPAY_NLU_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_NLU_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<{ transcript: string }, VoiceNluResult>(
      `${baseUrl}/nlu/parse`,
      apiKey,
      input
    );

    return {
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities ?? {},
      rawText: result.rawText ?? input.transcript
    };
  }

  return fallbackInterpret(input.transcript);
}
