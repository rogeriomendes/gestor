import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movimento do caixa",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
