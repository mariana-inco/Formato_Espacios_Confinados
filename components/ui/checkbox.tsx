"use client";

import type * as React from "react";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ checked = false, onCheckedChange, className = "", ...props }: CheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      checked={checked}
      aria-checked={checked}
      className={[
        "h-5 w-5 shrink-0 rounded-[6px] border border-slate-300 bg-white shadow-sm accent-sky-600",
        "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
        className,
      ].join(" ")}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  );
}
