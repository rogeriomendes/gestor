"use client";

type Tab = "details" | "users" | "branches";

interface TenantTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  usersCount: number;
  branchesCount: number;
}

export function TenantTabs({
  activeTab,
  onTabChange,
  usersCount,
  branchesCount,
}: TenantTabsProps) {
  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        <button
          className={`border-b-2 px-1 py-4 font-medium text-sm ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
          }`}
          onClick={() => onTabChange("details")}
          type="button"
        >
          Detalhes
        </button>
        <button
          className={`border-b-2 px-1 py-4 font-medium text-sm ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
          }`}
          onClick={() => onTabChange("users")}
          type="button"
        >
          Usuários ({usersCount})
        </button>
        <button
          className={`border-b-2 px-1 py-4 font-medium text-sm ${
            activeTab === "branches"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
          }`}
          onClick={() => onTabChange("branches")}
          type="button"
        >
          Filiais ({branchesCount})
        </button>
      </nav>
    </div>
  );
}
