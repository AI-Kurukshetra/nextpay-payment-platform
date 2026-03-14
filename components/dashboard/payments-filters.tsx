"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListPaymentsQueryInput } from "@/lib/validations/payment";

type PaymentsFiltersProps = {
  filters?: ListPaymentsQueryInput;
};

function toDateInputValue(value?: string) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function toStartOfDayIso(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toEndOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

type FilterState = {
  q: string;
  status: string;
  currency: string;
  createdFrom: string;
  createdTo: string;
};

export function PaymentsFilters({ filters }: PaymentsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<FilterState>({
    q: filters?.q ?? "",
    status: filters?.status ?? "",
    currency: filters?.currency ?? "",
    createdFrom: toDateInputValue(filters?.createdFrom),
    createdTo: toDateInputValue(filters?.createdTo)
  });
  const stateRef = useRef(state);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        state.q ||
          state.status ||
          state.currency ||
          state.createdFrom ||
          state.createdTo
      ),
    [state]
  );

  function pushUrl(next: FilterState) {
    const params = new URLSearchParams(searchParams.toString());
    const entries: Array<[string, string | undefined]> = [
      ["q", next.q],
      ["status", next.status],
      ["currency", next.currency?.toUpperCase()],
      ["minAmount", undefined],
      ["maxAmount", undefined],
      ["createdFrom", next.createdFrom ? toStartOfDayIso(next.createdFrom) : undefined],
      ["createdTo", next.createdTo ? toEndOfDayIso(next.createdTo) : undefined]
    ];

    for (const [key, value] of entries) {
      if (!value || value.length === 0) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function pushDebounced(next: FilterState) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => pushUrl(next), 350);
  }

  function updateState(partial: Partial<FilterState>, immediate = false) {
    const next = { ...stateRef.current, ...partial };
    stateRef.current = next;
    setState(next);
    if (immediate) {
      pushUrl(next);
      return;
    }
    pushDebounced(next);
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white/90 p-3">
      <div className="grid items-end gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <label className="min-w-0 sm:col-span-2 md:col-span-2 lg:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Search</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            onChange={(event) => updateState({ q: event.target.value })}
            placeholder="Payment ID or metadata"
            value={state.q}
          />
        </label>

        <label className="min-w-0">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Status</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            onChange={(event) => updateState({ status: event.target.value }, true)}
            value={state.status}
          >
            <option value="">All</option>
            <option value="requires_payment_method">Requires method</option>
            <option value="authorized">Authorized</option>
            <option value="requires_action">Requires action</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially refunded</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Currency</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm uppercase"
            maxLength={3}
            onChange={(event) => updateState({ currency: event.target.value })}
            placeholder="USD"
            value={state.currency}
          />
        </label>

        <div className="min-w-0 sm:col-span-2 md:col-span-2 lg:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Date Range</span>
          <div className="grid grid-cols-2 items-center gap-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              max={state.createdTo || undefined}
              onChange={(event) => {
                const value = event.target.value;
                const nextTo =
                  stateRef.current.createdTo && value && value > stateRef.current.createdTo
                    ? value
                    : stateRef.current.createdTo;
                updateState({ createdFrom: value, createdTo: nextTo }, true);
              }}
              type="date"
              value={state.createdFrom}
            />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              min={state.createdFrom || undefined}
              onChange={(event) => {
                const value = event.target.value;
                const nextFrom =
                  stateRef.current.createdFrom && value && value < stateRef.current.createdFrom
                    ? value
                    : stateRef.current.createdFrom;
                updateState({ createdFrom: nextFrom, createdTo: value }, true);
              }}
              type="date"
              value={state.createdTo}
            />
          </div>
        </div>

        <button
          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-1"
          disabled={!hasActiveFilters}
          onClick={() => {
            const cleared: FilterState = {
              q: "",
              status: "",
              currency: "",
              createdFrom: "",
              createdTo: ""
            };
            stateRef.current = cleared;
            setState(cleared);
            pushUrl(cleared);
          }}
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
