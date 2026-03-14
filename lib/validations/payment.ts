import { z } from "zod";

export const createPaymentSchema = z.object({
  customerId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  settlementCurrency: z.string().length(3).optional(),
  require3ds: z.boolean().default(false),
  routingMode: z.enum(["auto", "manual"]).default("auto"),
  routeType: z.enum(["card", "bank", "crypto"]).default("card"),
  preferredProcessor: z
    .enum(["stripe", "adyen", "razorpay", "bank_gateway", "crypto_processor"])
    .optional(),
  metadata: z.record(z.string()).default({})
}).superRefine((value, ctx) => {
  if (value.routingMode === "manual" && !value.preferredProcessor) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "preferredProcessor is required when routingMode is manual",
      path: ["preferredProcessor"]
    });
  }

  if (value.routingMode === "manual" && value.preferredProcessor) {
    const validForType: Record<"card" | "bank" | "crypto", string[]> = {
      card: ["stripe", "adyen", "razorpay"],
      bank: ["bank_gateway"],
      crypto: ["crypto_processor"]
    };
    if (!validForType[value.routeType].includes(value.preferredProcessor)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "preferredProcessor does not match selected routeType",
        path: ["preferredProcessor"]
      });
    }
  }
});

export const capturePaymentSchema = z.object({
  confirm: z.literal(true)
});

export const refundPaymentSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(3).max(200).optional()
});

export const listPaymentsQuerySchema = z.object({
  q: z.string().min(1).optional(),
  status: z
    .enum([
      "requires_payment_method",
      "requires_action",
      "authorized",
      "succeeded",
      "failed",
      "refunded",
      "partially_refunded"
    ])
    .optional(),
  currency: z.string().length(3).optional(),
  minAmount: z.number().int().positive().optional(),
  maxAmount: z.number().int().positive().optional(),
  createdFrom: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid createdFrom date" })
    .optional(),
  createdTo: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid createdTo date" })
    .optional()
});

export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type ListPaymentsQueryInput = z.infer<typeof listPaymentsQuerySchema>;
