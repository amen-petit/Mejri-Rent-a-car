/**
 * Curated real Google reviews (approach A: hand-picked from the business's
 * listing). Text is kept in each reviewer's original language on purpose; only
 * the section's chrome is localized. Dates and the small total count are
 * intentionally not surfaced. Update this list by hand when you want fresher
 * quotes; swap to the Google Places API later behind the same component if you
 * ever want it to self-refresh.
 */
export type Review = {
  author: string;
  /** Monogram shown in the avatar (no hotlinked Google profile photos). */
  initials: string;
  rating: number; // 1-5
  text: string;
};

export const GOOGLE_REVIEWS: Review[] = [
  {
    author: "amen allah sghairi",
    initials: "AS",
    rating: 5,
    text: "Excellente expérience du début à la fin ! La réservation a été simple et rapide, l'accueil était chaleureux et très professionnel, et le véhicule était propre, confortable et en parfait état. Tout s'est déroulé exactement comme prévu, sans mauvaise surprise.",
  },
  {
    author: "Stefano Anselmi",
    initials: "SA",
    rating: 5,
    text: "Good prices, reliable, good quality of cars.",
  },
  {
    author: "Riadh Khlifi",
    initials: "RK",
    rating: 5,
    text: "Best agency, keep up the good work!",
  },
];
