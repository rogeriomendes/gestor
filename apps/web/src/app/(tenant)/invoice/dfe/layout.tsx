import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doc. Fiscal Eletrônico",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
