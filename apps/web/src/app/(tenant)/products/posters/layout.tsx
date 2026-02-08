import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cartazes",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
