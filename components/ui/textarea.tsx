"use client";

import type * as React from "react";

// Componente reutilizable para campos de texto multilínea con el estilo del formulario.
export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "field-shell__value field-shell__input field-shell__textarea w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
        className,
      ].join(" ")}
    />
  );
}
