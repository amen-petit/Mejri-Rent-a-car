import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#fee076] hover:shadow-soft-lg ${className}`}
      {...props}
    />
  );
}
