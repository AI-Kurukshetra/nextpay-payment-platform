import { z } from "zod";

export const createNotificationSchema = z.object({
  channel: z.enum(["email", "sms", "dashboard", "webhook"]).default("dashboard"),
  title: z.string().min(3).max(120),
  message: z.string().min(3).max(500)
});

export const updateNotificationSchema = z.object({
  status: z.enum(["unread", "read"])
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
