import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { InvoiceRecord, MerchantRecord } from "@/lib/store/types";
import type { CreateInvoiceInput, UpdateInvoiceInput } from "@/lib/validations/invoice";

export async function createInvoice(merchant: MerchantRecord, input: CreateInvoiceInput) {
  const invoice: InvoiceRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    customerId: input.customerId,
    subscriptionId: input.subscriptionId ?? null,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    status: "open",
    dueAt: input.dueAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  db.invoices.set(invoice.id, invoice);
  return invoice;
}

export async function listInvoices(merchant: MerchantRecord) {
  return Array.from(db.invoices.values())
    .filter((invoice) => invoice.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateInvoice(merchant: MerchantRecord, invoiceId: string, input: UpdateInvoiceInput) {
  const existing = db.invoices.get(invoiceId);
  if (!existing || existing.merchantId !== merchant.id) {
    throw new AppError(404, "invoice_not_found");
  }

  const updated: InvoiceRecord = {
    ...existing,
    status: input.status ?? existing.status
  };
  db.invoices.set(invoiceId, updated);
  return updated;
}
