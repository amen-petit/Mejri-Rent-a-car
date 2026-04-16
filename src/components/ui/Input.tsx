import type { DetailedHTMLProps, InputHTMLAttributes } from "react";

interface InputProps extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  label?: string;
  className?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block text-sm">
      {label ? (
        <span className="mb-2 block font-semibold text-slate-700">{label}</span>
      ) : null}
      <input
        className={`w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-250 placeholder:text-slate-400 focus:border-[#89a9f1] focus:ring-2 focus:ring-[#89a9f1]/20 ${className}`}
        {...props}
      />
    </label>
  );
}
