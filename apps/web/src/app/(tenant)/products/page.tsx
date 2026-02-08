import type { Metadata } from "next";
import ProductsList from "./list/page";

export const metadata: Metadata = {
  title: "Produtos",
};

export default function Products() {
  return <ProductsList />;
}
