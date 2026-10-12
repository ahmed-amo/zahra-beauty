import { landingConfig } from "@/landing/landing.config";
import type { Product } from "@/types/products";

export type LandingCategory = "Women" | "Men" | "Accessories" | "Footwear";

export type LandingProduct = {
  id: number;
  name: string;
  price: number;
  category: LandingCategory;
  image: string;
  hoverImage?: string;
  slug: string;
  description: string;
};

/** Swap these paths for your own photos. One map, whole landing page. */
export const IMAGES = {
  hero1: "/zahra/photos/robe-sauge.jpg",
  hero2: "/zahra/photos/robe-noire.jpg",
  hero3: "/zahra/photos/abaya-olive.jpg",
  women: "/zahra/photos/robe-sauge.jpg",
  men: "/zahra/photos/manteau-camel.jpg",
  accessories: "/zahra/photos/sac-tresse.jpg",
  footwear: "/zahra/photos/sneakers-blanches.jpg",
  handbag: "/zahra/photos/sac-tresse.jpg",
  backpack: "/zahra/photos/sac-dos.jpg",
  sneakers: "/zahra/photos/sneakers-blanches.jpg",
  dress: "/zahra/photos/ensemble-beige.jpg",
  blackDress: "/zahra/photos/robe-noire.jpg",
  hijab: "/zahra/photos/hijab-ivoire.jpg",
  hijabBlack: "/zahra/photos/hijab-noir.jpg",
  coat: "/zahra/photos/manteau-camel.jpg",
  pack: "/zahra/photos/pack-universitaire.jpg",
  packEvening: "/zahra/photos/pack-soiree.jpg",
  bagEdit: "/zahra/photos/sac-dos.jpg",
} as const;

/** Screenshot catalog. Amounts are Algerian dinars, not dollars. */
export const MOCK_PRODUCTS: LandingProduct[] = [
  { id: 9101, name: "Classic Handbag", price: 6500, category: "Accessories", image: IMAGES.handbag, hoverImage: IMAGES.backpack, slug: "classic-handbag", description: "Classic handbag" },
  { id: 9102, name: "Minimal Watch", price: 8500, category: "Accessories", image: IMAGES.hijab, slug: "minimal-watch", description: "Minimal watch" },
  { id: 9103, name: "Oversized Hoodie", price: 4500, category: "Men", image: IMAGES.coat, slug: "oversized-hoodie", description: "Oversized hoodie" },
  { id: 9104, name: "Leather Sneakers", price: 7200, category: "Footwear", image: IMAGES.sneakers, slug: "leather-sneakers", description: "Leather sneakers" },
  { id: 9105, name: "Linen Shirt", price: 3800, category: "Men", image: IMAGES.hijabBlack, slug: "linen-shirt", description: "Linen shirt" },
  { id: 9106, name: "Summer Dress", price: 5600, category: "Women", image: IMAGES.dress, hoverImage: IMAGES.hero1, slug: "summer-dress", description: "Summer dress" },
  { id: 9107, name: "Denim Jacket", price: 6200, category: "Women", image: IMAGES.coat, slug: "denim-jacket", description: "Denim jacket" },
  { id: 9108, name: "Sunglasses", price: 2800, category: "Accessories", image: IMAGES.hijab, slug: "sunglasses", description: "Sunglasses" },
  { id: 9109, name: "Knitted Sweater", price: 4200, category: "Women", image: IMAGES.blackDress, slug: "knitted-sweater", description: "Knitted sweater" },
  { id: 9110, name: "Casual Jacket", price: 5600, category: "Men", image: IMAGES.coat, slug: "casual-jacket", description: "Casual jacket" },
  { id: 9111, name: "Ribbed Knit Top", price: 4900, category: "Women", image: IMAGES.dress, slug: "ribbed-knit-top", description: "Ribbed knit top" },
  { id: 9112, name: "Oversized Blazer", price: 8900, category: "Women", image: IMAGES.packEvening, slug: "oversized-blazer", description: "Oversized blazer" },
  { id: 9113, name: "Classic White Shirt", price: 5900, category: "Women", image: IMAGES.hijab, slug: "classic-white-shirt", description: "Classic white shirt" },
  { id: 9114, name: "Tailored Wide Leg Pants", price: 7900, category: "Women", image: IMAGES.hero3, slug: "tailored-wide-leg-pants", description: "Tailored wide leg pants" },
];

function bucket(category: string | null, name: string): LandingCategory {
  const n = `${category ?? ""} ${name}`.toLowerCase();
  if (/(sneaker|chauss|footwear|basket)/.test(n)) return "Footwear";
  if (/(access|sac|hijab|pack|bag|watch|sunglass)/.test(n)) return "Accessories";
  if (/(manteau|coat|men|homme|hoodie|jacket)/.test(n)) return "Men";
  return "Women";
}

/**
 * Landing catalog.
 * TODO: replace with real products — pass the shop payload, or set useRealProducts.
 */
export function getLandingProducts(real: Product[] = []): LandingProduct[] {
  if (landingConfig.useRealProducts && real.length > 0) {
    return real.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: bucket(product.category, product.name),
      image: product.image_url || product.images?.[0] || IMAGES.dress,
      hoverImage: product.images?.[1] || undefined,
      slug: product.slug,
      description: product.description ?? product.name,
    }));
  }

  return MOCK_PRODUCTS;
}
