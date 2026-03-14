export type StorefrontProduct = {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  image: string;
};

export const STOREFRONT_PRODUCTS: StorefrontProduct[] = [
  {
    id: "prod_starter_kit",
    name: "Starter Kit",
    description: "Entry bundle for first-time customers.",
    amount: 1299,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "prod_growth_pack",
    name: "Growth Pack",
    description: "Best value package for regular usage.",
    amount: 3499,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "prod_premium_box",
    name: "Premium Box",
    description: "High-tier option with priority fulfillment.",
    amount: 6999,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80"
  }
];
