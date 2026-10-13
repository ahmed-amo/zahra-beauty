import type { ReactNode } from "react";
import LandingLayout from "@/landing/LandingLayout";
import LandingPage from "@/landing/LandingPage";
import type { Product } from "@/types/products";

type CoverProp = { image_url?: string | null } | null;
type HeroSlideProp = { imageSrc?: string | null };
type BrandProp = { name?: string; image_url?: string | null };
type CategoryProp = { name: string; slug: string; image_url?: string | null };

export default function Home({
  products,
  cover = null,
  heroSlides = [],
  brands = [],
  categories = [],
}: {
  products?: Product[];
  cover?: CoverProp;
  heroSlides?: HeroSlideProp[];
  brands?: BrandProp[];
  categories?: CategoryProp[];
}) {
  return (
    <LandingPage
      products={products ?? []}
      cover={cover}
      heroSlides={heroSlides}
      brands={brands}
      categories={categories}
    />
  );
}

Home.layout = (page: ReactNode) => <LandingLayout>{page}</LandingLayout>;
