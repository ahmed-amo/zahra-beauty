/** Switch the home page here. The rest of the shop is unchanged. */
export const LANDING_BRAND = "Zahra";

export const landingConfig = {
  /** "a" = dark luxe (default). "b" = light editorial. */
  theme: "a" as "a" | "b",
  /**
   * true: featured/best-seller cards use the live catalog (real id, slug, photo, DA price).
   * false: screenshot-style mock names from landing/mock.ts.
   */
  useRealProducts: true,
  sections: {
    announcement: false,
    hero: true,
    categories: true,
    featured: true,
    promo: true,
    bestsellers: true,
    summerSale: true,
    /** Design B only, unless you set this true while theme is "a". */
    testimonials: false,
    instagram: false,
    newsletter: true,
  },
};
