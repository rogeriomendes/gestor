import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Admin | GestorWeb - Sistema ERP",
    default: "Dashboard | Admin",
  },
  description: "GestorWeb - Sistema ERP de automação comercial",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
