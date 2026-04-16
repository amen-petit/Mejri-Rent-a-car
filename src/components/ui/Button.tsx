import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "text-[#1f2430] shadow-soft hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#89a9f1]",
  secondary:
    "bg-navy-500 text-white shadow-soft hover:-translate-y-0.5 hover:bg-navy-600 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-navy-300",
  outline:
    "border-2 border-navy-500 text-navy-500 bg-transparent hover:bg-navy-50 focus-visible:ring-2 focus-visible:ring-navy-300",
  ghost:
    "bg-slate-100 text-navy-500 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const style =
    variant === "primary"
      ? { background: "linear-gradient(135deg, #89a9f1 0%, #a66694 100%)" }
      : {};

  return (
    <button
      style={style}
      className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-250 ease-out focus:outline-none ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
