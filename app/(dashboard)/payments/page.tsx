import { getPaymentsData } from "@/lib/dashboard/data";

export const metadata = { title: "Payments | NextPay" };

function formatAmount(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

export default async function PaymentsPage() {
  const { isConfigured, payments } = await getPaymentsData();

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Payments</h2>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">Live ledger</span>
      </div>

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
