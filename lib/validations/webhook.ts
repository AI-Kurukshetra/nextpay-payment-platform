import { z } from "zod";

export const registerWebhookEndpointSchema = z.object({
  url: z.string().url()
});

export const emitWebhookEventSchema = z.object({
  type: z.string().min(3),
  payload: z.record(z.unknown())
});

export type RegisterWebhookEndpointInput = z.infer<typeof registerWebhookEndpointSchema>;
export type EmitWebhookEventInput = z.infer<typeof emitWebhookEventSchema>;
