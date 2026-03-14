import { getCustomersData } from "@/lib/dashboard/data";

export const metadata = { title: "Customers | PayForge" };

export default async function CustomersPage() {
  const { isConfigured, customers } = await getCustomersData();

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-xl font-semibold">Customers</h2>
      <p className="mt-1 text-sm text-slate-600">Live customer profiles mapped to your merchant account.</p>

      {!isConfigured ? (
        <p className="mt-4 text-sm text-amber-700">Login required to load live rows.</p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {customers.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">No customers yet.</article>
        ) : (
          customers.map((customer) => (
            <article className="rounded-xl border border-slate-200 bg-white p-4" key={customer.id}>
              <h3 className="font-medium">{customer.name}</h3>
              <p className="text-sm text-slate-600">{customer.email}</p>
              <span className="mt-2 inline-block rounded-full bg-cyan-50 px-2 py-1 text-xs text-cyan-700">
                Created {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
