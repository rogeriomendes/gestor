import { TenantLayoutClient } from "./tenant-layout-client";

// Server Component — sem "use client".
// Toda a lógica client (guards, providers, sidebar) está em TenantLayoutClient.
export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TenantLayoutClient>{children}</TenantLayoutClient>;
}
