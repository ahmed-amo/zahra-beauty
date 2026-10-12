import type { ReactNode } from "react";
import LandingLayout from "@/landing/LandingLayout";
import LandingPage from "@/landing/LandingPage";
import type { Product } from "@/types/products";

export default function Home({ products }: { products?: Product[] }) {
  return <LandingPage products={products ?? []} />;
}

Home.layout = (page: ReactNode) => <LandingLayout>{page}</LandingLayout>;
