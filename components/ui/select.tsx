"use client";

import type * as React from "react";

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "field-shell__value field-shell__input w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
        className,
      ].join(" ")}
    />
  );
}
