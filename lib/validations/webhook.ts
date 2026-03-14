import { z } from "zod";

export const registerWebhookEndpointSchema = z.object({
  url: z.string().url()
});

export const updateWebhookEndpointSchema = z.object({
  url: z.string().url().optional(),
  isActive: z.boolean().optional()
});

export const emitWebhookEventSchema = z.object({
  type: z.string().min(3),
  payload: z.record(z.unknown())
});

export type RegisterWebhookEndpointInput = z.infer<typeof registerWebhookEndpointSchema>;
export type UpdateWebhookEndpointInput = z.infer<typeof updateWebhookEndpointSchema>;
export type EmitWebhookEventInput = z.infer<typeof emitWebhookEventSchema>;
