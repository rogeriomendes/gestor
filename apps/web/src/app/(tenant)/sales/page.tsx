import type { Metadata } from "next";
import SalesList from "./list/page";

export const metadata: Metadata = {
  title: "Vendas",
};

export default function Sales() {
  return <SalesList />;
}
