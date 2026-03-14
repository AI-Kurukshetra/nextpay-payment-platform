import { AppError } from "@/lib/api/errors";
import { interpretVoiceCommand, transcribeVoiceWithProvider } from "@/lib/integrations/voice-provider";
import { capturePayment, createPayment } from "@/lib/services/payment-service";
import { createRefund } from "@/lib/services/refund-service";
import type { MerchantRecord, PaymentRecord, RefundRecord } from "@/lib/store/types";
import type { VoicePaymentCommandInput } from "@/lib/validations/voice";

export type ExecuteVoicePaymentCommandResult = {
  transcript: string;
  interpretedIntent: "create_payment" | "capture_payment" | "refund_payment";
  confidence: number;
  payment?: PaymentRecord;
  refund?: RefundRecord;
};

function buildVoiceMetadata(input: {
  transcript: string;
  confidence: number;
  metadata: Record<string, string>;
}) {
  return {
    ...input.metadata,
    commandSource: "voice",
    voiceTranscript: input.transcript,
    nluConfidence: input.confidence.toFixed(2)
  };
}

export async function executeVoicePaymentCommand(
  merchant: MerchantRecord,
  input: VoicePaymentCommandInput
): Promise<ExecuteVoicePaymentCommandResult> {
  const transcript =
    input.source === "audio"
      ? (
          await transcribeVoiceWithProvider({
            audioUrl: input.audioUrl,
            audioBase64: input.audioBase64,
            transcriptHint: input.transcript
          })
        ).transcript
      : input.transcript ?? "";

  if (!transcript) {
    throw new AppError(400, "voice_transcript_missing");
  }

  const interpreted = await interpretVoiceCommand({ transcript });
  const metadata = buildVoiceMetadata({
    transcript,
    confidence: interpreted.confidence,
    metadata: input.metadata ?? {}
  });

  if (interpreted.intent === "create_payment") {
    const amount = interpreted.entities.amount;
    const currency = interpreted.entities.currency;

    if (!amount || !currency) {
      throw new AppError(400, "voice_command_missing_create_payment_fields");
    }

    const payment = await createPayment(
      merchant,
      {
        customerId: interpreted.entities.customerId,
        amount,
        currency,
        metadata
      },
      input.idempotencyKey
    );

    return {
      transcript,
      interpretedIntent: "create_payment",
      confidence: interpreted.confidence,
      payment
    };
  }

  if (interpreted.intent === "capture_payment") {
    const paymentId = interpreted.entities.paymentId;
    if (!paymentId) {
      throw new AppError(400, "voice_command_missing_payment_id");
    }

    const payment = await capturePayment(merchant, paymentId);
    return {
      transcript,
      interpretedIntent: "capture_payment",
      confidence: interpreted.confidence,
      payment
    };
  }

  if (interpreted.intent === "refund_payment") {
    const paymentId = interpreted.entities.paymentId;
    const amount = interpreted.entities.amount;
    if (!paymentId || !amount) {
      throw new AppError(400, "voice_command_missing_refund_fields");
    }

    const refund = await createRefund(merchant, paymentId, {
      amount,
      reason: interpreted.entities.reason
    });

    return {
      transcript,
      interpretedIntent: "refund_payment",
      confidence: interpreted.confidence,
      refund
    };
  }

  throw new AppError(400, "voice_command_unrecognized");
}
