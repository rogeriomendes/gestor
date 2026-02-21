import {
  BarChart3,
  DollarSign,
  type LucideIcon,
  Package,
  PieChart,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

export interface ReportConfig {
  category: "sales" | "financial" | "inventory" | "analytics";
  categoryName: "Vendas" | "Financeiro" | "Estoque" | "Analíticos";
  color?: string;
  component: () => Promise<{
    default?: React.ComponentType<any>;
    [key: string]: any;
  }>;
  description: string;
  getExportData: (data: any) => any[];
  getExportFilename: (filters: any) => string;
  icon: LucideIcon;
  id: string;
  queries: string[]; // Nomes das queries necessárias
  title: string;
}

export const reportRegistry: ReportConfig[] = [
  {
    id: "sales",
    title: "Vendas por Dia",
    description: "Análise de vendas diárias com gráficos e tendências",
    icon: ShoppingCart,
    category: "sales",
    categoryName: "Vendas",
    color: "hsl(var(--chart-1))",
    queries: ["salesPerDay"],
    component: () => import("../_components/SalesCharts"),
    getExportData: (data) => data?.salesPerDay?.totalValuePerDay || [],
    getExportFilename: (filters) =>
      `vendas_por_dia_${filters.initialDate}_${filters.finalDate}`,
  },
  {
    id: "sellers",
    title: "Vendas por Vendedor",
    description: "Performance de vendas por vendedor",
    icon: Users,
    category: "sales",
    categoryName: "Vendas",
    color: "hsl(var(--chart-2))",
    queries: ["salesPerSeller"],
    component: () => import("../_components/SellersCharts"),
    getExportData: (data) => data?.salesPerSeller?.salesPerSeller || [],
    getExportFilename: (filters) =>
      `vendas_por_vendedor_${filters.initialDate}_${filters.finalDate}`,
  },
  {
    id: "products",
    title: "Produtos Mais Vendidos",
    description: "Ranking dos produtos com maior volume de vendas",
    icon: Package,
    category: "sales",
    categoryName: "Vendas",
    color: "hsl(var(--chart-3))",
    queries: ["topProducts"],
    component: () => import("../_components/ProductsList"),
    getExportData: (data) => data?.topProducts?.topProducts || [],
    getExportFilename: (filters) =>
      `produtos_mais_vendidos_${filters.initialDate}_${filters.finalDate}`,
  },
  {
    id: "types",
    title: "Vendas por Tipo",
    description: "Análise de vendas por tipo de operação",
    icon: PieChart,
    category: "sales",
    categoryName: "Vendas",
    color: "hsl(var(--chart-4))",
    queries: ["salesPerType"],
    component: () => import("../_components/TypesCharts"),
    getExportData: (data) => data?.salesPerType?.result || [],
    getExportFilename: (filters) =>
      `vendas_por_tipo_${filters.initialDate}_${filters.finalDate}`,
  },
  {
    id: "financial",
    title: "Financeiro",
    description: "Análise financeira completa com contas a receber e resumo",
    icon: DollarSign,
    category: "financial",
    categoryName: "Financeiro",
    color: "hsl(var(--chart-5))",
    queries: ["accountsReceivable", "financialSummary"],
    component: () => import("../_components/FinancialCharts"),
    getExportData: (data) => data?.accountsReceivable?.accountsReceivable || [],
    getExportFilename: (filters) =>
      `contas_receber_${filters.initialDate}_${filters.finalDate}`,
  },
  {
    id: "stock",
    title: "Posição de Estoque",
    description: "Análise completa da posição de estoque",
    icon: Warehouse,
    category: "inventory",
    categoryName: "Estoque",
    color: "hsl(var(--chart-1))",
    queries: ["stockPosition"],
    component: () => import("../_components/StockCharts"),
    getExportData: (data) => data?.stockPosition?.stockPosition || [],
    getExportFilename: (filters) =>
      `posicao_estoque_${filters.initialDate}_${filters.finalDate}`,
  },
];

export function getReportById(id: string): ReportConfig | undefined {
  return reportRegistry.find((report) => report.id === id);
}

export function getReportsByCategory(
  category: ReportConfig["category"]
): ReportConfig[] {
  return reportRegistry.filter((report) => report.category === category);
}

export const reportCategories = [
  { id: "sales", label: "Vendas", icon: ShoppingCart },
  { id: "financial", label: "Financeiro", icon: DollarSign },
  { id: "inventory", label: "Estoque", icon: Warehouse },
  { id: "analytics", label: "Analíticos", icon: BarChart3 },
] as const;
