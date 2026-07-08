/**
 * Google reviews showcase (real, curated). Editorial composition on the dark
 * band: one featured quote + two supporting quotes, hairline-separated, matching
 * the site's grammar. No cards, no dates, no aggregate count. Reviews render in
 * their original language (dir="auto"); only the chrome is localized.
 */
import type { Messages } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/format";
import { GOOGLE_REVIEWS, type Review } from "@/lib/reviews";
import { REVIEWS_URL } from "@/lib/constants";

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={i < rating ? "h-3.5 w-3.5 text-accent" : "h-3.5 w-3.5 text-white/20"}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.25 6.09 20.36l1.13-6.57L2.45 9.14l6.6-.96z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-display text-sm text-white/85"
    >
      {initials}
    </span>
  );
}

function Attribution({ review, t }: { review: Review; t: Messages }) {
  return (
    <figcaption className="mt-6 flex items-center gap-3">
      <Avatar initials={review.initials} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white" dir="auto">
          {review.author}
        </p>
        <p className="text-xs text-white/40">{t.reviews.googleTag}</p>
      </div>
    </figcaption>
  );
}

export default function ReviewsShowcase({ t }: { t: Messages }) {
  const [featured, ...supporting] = GOOGLE_REVIEWS;
  const starLabel = (rating: number) =>
    interpolate(t.reviews.ratingLabel, { rating });

  return (
    <div className="border-b border-white/10 py-16 lg:py-24">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/40">
            {t.reviews.eyebrow}
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-white">
            {t.reviews.title}
          </h2>
        </div>
        <a
          href={REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-2 border-b border-white/25 pb-1 text-sm font-medium text-white transition-colors hover:border-white"
        >
          {t.reviews.viewAll}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Featured + supporting */}
      <div className="mt-14 grid gap-x-16 gap-y-12 lg:grid-cols-2">
        {featured && (
          <figure data-reveal className="reveal-d1">
            <Stars rating={featured.rating} label={starLabel(featured.rating)} />
            <blockquote
              dir="auto"
              className="mt-6 font-display text-[clamp(1.35rem,2vw,1.75rem)] font-medium leading-[1.42] text-white"
            >
              {featured.text}
            </blockquote>
            <Attribution review={featured} t={t} />
          </figure>
        )}

        <div className="flex flex-col justify-center gap-8 lg:border-s lg:border-white/10 lg:ps-16">
          {supporting.map((review, i) => (
            <figure
              key={review.author}
              data-reveal
              className={`reveal-d${i + 2} ${i > 0 ? "border-t border-white/10 pt-8" : ""}`}
            >
              <Stars rating={review.rating} label={starLabel(review.rating)} />
              <blockquote
                dir="auto"
                className="mt-4 text-base leading-relaxed text-white/85"
              >
                {review.text}
              </blockquote>
              <Attribution review={review} t={t} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
