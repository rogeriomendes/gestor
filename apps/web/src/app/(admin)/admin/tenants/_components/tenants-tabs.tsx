"use client";

interface TenantsTabsProps {
  activeTab: string;
  deletedCount: number;
  onTabChange: (tab: string) => void;
}

export function TenantsTabs({
  activeTab,
  deletedCount,
  onTabChange,
}: TenantsTabsProps) {
  return (
    <nav className="flex space-x-4 border-b">
      <button
        className={`border-b-2 px-1 py-4 font-medium text-sm ${
          activeTab === "active"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
        }`}
        onClick={() => onTabChange("active")}
        type="button"
      >
        Ativos
      </button>
      <button
        className={`border-b-2 px-1 py-4 font-medium text-sm ${
          activeTab === "deleted"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
        }`}
        onClick={() => onTabChange("deleted")}
        type="button"
      >
        Lixeira ({deletedCount})
      </button>
    </nav>
  );
}
