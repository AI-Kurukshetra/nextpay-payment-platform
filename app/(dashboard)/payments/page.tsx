import { getPaymentsData } from "@/lib/dashboard/data";
import { PaymentsFilters } from "@/components/dashboard/payments-filters";
import { listPaymentsQuerySchema } from "@/lib/validations/payment";

export const metadata = { title: "Payments | PayForge" };

function formatAmount(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

function parsePositiveInt(value: string | string[] | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.trunc(parsed);
}

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = listPaymentsQuerySchema.safeParse({
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    currency: typeof params.currency === "string" ? params.currency : undefined,
    minAmount: parsePositiveInt(params.minAmount),
    maxAmount: parsePositiveInt(params.maxAmount),
    createdFrom: typeof params.createdFrom === "string" ? params.createdFrom : undefined,
    createdTo: typeof params.createdTo === "string" ? params.createdTo : undefined
  });
  const filters = parsed.success ? parsed.data : undefined;
  const { isConfigured, payments } = await getPaymentsData(filters);
  const query = new URLSearchParams();
  if (filters?.q) query.set("q", filters.q);
  if (filters?.status) query.set("status", filters.status);
  if (filters?.currency) query.set("currency", filters.currency);
  if (typeof filters?.minAmount === "number") query.set("minAmount", String(filters.minAmount));
  if (typeof filters?.maxAmount === "number") query.set("maxAmount", String(filters.maxAmount));
  if (filters?.createdFrom) query.set("createdFrom", filters.createdFrom);
  if (filters?.createdTo) query.set("createdTo", filters.createdTo);

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Payments</h2>
        <div className="flex items-center gap-2">
          <a
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
            href={`/api/v1/reporting/transactions/export?${query.toString()}`}
          >
            Export CSV
          </a>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">Live ledger</span>
        </div>
      </div>

      <PaymentsFilters filters={filters} />

      {!isConfigured ? (
        <p className="mt-4 text-sm text-amber-700">Login required to load live rows.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="pb-2">Payment ID</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Risk Score</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td className="py-4 text-slate-500" colSpan={5}>
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((row) => (
                <tr className="border-t border-slate-200" key={row.id}>
                  <td className="py-3 font-medium">{row.id.slice(0, 18)}...</td>
                  <td className="py-3">{formatAmount(row.amount, row.currency)}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{row.status}</span>
                  </td>
                  <td className="py-3">{row.riskScore}</td>
                  <td className="py-3">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
