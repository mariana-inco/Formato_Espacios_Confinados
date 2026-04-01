"use client";

import type * as React from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variantClass =
    variant === "secondary"
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "accent"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : variant === "ghost"
          ? "bg-transparent text-slate-700 hover:bg-slate-100"
          : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button
      {...props}
      className={[
        "rounded-lg px-5 py-3 text-base font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClass,
        className,
      ].join(" ")}
    />
  );
}
