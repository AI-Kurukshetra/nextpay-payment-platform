import { z } from "zod";

export const voicePaymentCommandSchema = z
  .object({
    source: z.enum(["text", "audio"]).default("text"),
    transcript: z.string().min(3).max(500).optional(),
    audioUrl: z.string().url().optional(),
    audioBase64: z.string().min(20).optional(),
    idempotencyKey: z.string().min(6).max(120).optional(),
    metadata: z.record(z.string()).default({})
  })
  .superRefine((value, ctx) => {
    if (value.source === "text" && !value.transcript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "transcript is required for text source",
        path: ["transcript"]
      });
    }

    if (value.source === "audio" && !value.audioUrl && !value.audioBase64 && !value.transcript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "audioUrl, audioBase64, or transcript is required for audio source",
        path: ["audioUrl"]
      });
    }
  });

export type VoicePaymentCommandInput = z.input<typeof voicePaymentCommandSchema>;
