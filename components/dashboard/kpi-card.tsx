type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export function KpiCard({ label, value, delta }: KpiCardProps) {
  return (
    <article className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-semibold">{value}</p>
        {delta ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{delta}</span> : null}
      </div>
    </article>
  );
}
