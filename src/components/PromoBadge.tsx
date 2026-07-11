/**
 * Promotional badge. Pure and presentational (no hooks), so it renders in both
 * Server Components (home fleet) and Client Components (hero, detail). It shows
 * the campaign's label when set, otherwise a language-neutral discount summary
 * ("-20%" / "-15 DT"). The colour follows the promotion's chosen `badge_style`,
 * mapped to the design-system tokens — no new visual language.
 */
import type { Promotion, PromotionBadgeStyle } from "@/lib/types";

const STYLE_CLASSES: Record<PromotionBadgeStyle, string> = {
  warm: "bg-[var(--color-warm)] text-ink",
  accent: "bg-accent text-white",
  ink: "bg-ink text-paper",
};

function discountSummary(promo: Promotion): string {
  return promo.discount_type === "percentage"
    ? `-${promo.discount_value}%`
    : `-${promo.discount_value} DT`;
}

export default function PromoBadge({
  promotion,
  className = "",
}: {
  promotion: Pick<Promotion, "label" | "badge_style" | "discount_type" | "discount_value">;
  className?: string;
}) {
  const label =
    promotion.label?.trim() || discountSummary(promotion as Promotion);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${STYLE_CLASSES[promotion.badge_style]} ${className}`}
    >
      {label}
    </span>
  );
}
