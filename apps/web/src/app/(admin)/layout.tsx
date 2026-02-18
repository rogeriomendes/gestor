import { AdminLayoutClient } from "./admin-layout-client";

// Server Component — sem "use client".
// Toda a lógica client (guard, sidebar) está em AdminLayoutClient.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
