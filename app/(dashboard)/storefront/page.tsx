import { DemoStorefront } from "@/components/storefront/demo-storefront";
import { STOREFRONT_PRODUCTS } from "@/lib/storefront/catalog";

export const metadata = { title: "Storefront | PayForge" };

export default function StorefrontPage() {
  return <DemoStorefront products={STOREFRONT_PRODUCTS} />;
}
