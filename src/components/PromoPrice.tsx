/**
 * Discounted price display: the original per-day price struck through, the
 * discounted price prominently, and an optional savings chip. Pure and
 * presentational so it renders anywhere; the currency `unit` (e.g. "DT/day") is
 * passed in from the caller's i18n so wording stays localized while the discount
 * formatting lives in exactly one place. `size` and `tone` adapt it to cards
 * (small, light) vs the hero/detail (large, and dark surfaces).
 */
type Props = {
  original: number;
  discounted: number;
  unit: string;
  savingsPct?: number;
  size?: "sm" | "lg";
  tone?: "light" | "dark";
  className?: string;
};

export default function PromoPrice({
  original,
  discounted,
  unit,
  savingsPct,
  size = "sm",
  tone = "light",
  className = "",
}: Props) {
  const strike = tone === "dark" ? "text-white/40" : "text-ash";
  const main = tone === "dark" ? "text-white" : "text-ink";
  const mainSize = size === "lg" ? "text-2xl" : "text-xl";

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className={`text-sm line-through ${strike}`}>{original}</span>
      <span className={`font-display ${mainSize} font-medium leading-none ${main}`}>
        {discounted}
        <span className={`ms-1 text-xs font-normal ${strike}`}>{unit}</span>
      </span>
      {savingsPct != null && savingsPct > 0 && (
        <span className="rounded-full bg-[var(--color-warm)] px-1.5 py-0.5 text-[0.6rem] font-semibold text-ink">
          -{savingsPct}%
        </span>
      )}
    </span>
  );
}
