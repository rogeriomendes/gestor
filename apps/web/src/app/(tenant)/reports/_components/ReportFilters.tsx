"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FilterIcon, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  initialFilters?: ReportFilters;
  reportId?: string;
}

export interface ReportFilters {
  initialDate: Date;
  finalDate: Date;
  sellerId?: number;
  clientId?: number;
  categoryId?: number;
  status?: string;
  limit?: number;
  searchTerm?: string;
  orderBy?: "value" | "quantity";
}

export function ReportFilters({
  onFiltersChange,
  initialFilters,
  reportId,
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    initialDate:
      initialFilters?.initialDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    finalDate: initialFilters?.finalDate || new Date(),
    sellerId: initialFilters?.sellerId,
    clientId: initialFilters?.clientId,
    categoryId: initialFilters?.categoryId,
    status: initialFilters?.status || "all",
    limit: initialFilters?.limit || 10,
    searchTerm: initialFilters?.searchTerm || "",
    orderBy: initialFilters?.orderBy || "value",
  });

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Não aplica automaticamente, apenas atualiza o estado local
  };

  const applyFilters = () => {
    onFiltersChange(filters);
  };

  const resetFilters = () => {
    const defaultFilters: ReportFilters = {
      initialDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      finalDate: new Date(),
      status: "all",
      limit: 10,
      searchTerm: "",
      orderBy: "value",
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FilterIcon className="mr-2 h-5 w-5" />
          Filtros do Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Período */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="initial-date">
              Data Inicial
            </label>
            <Popover>
              <PopoverTrigger>
                <Button
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.initialDate && "text-muted-foreground"
                  )}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.initialDate ? (
                    format(filters.initialDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  captionLayout="dropdown"
                  initialFocus
                  locale={ptBR}
                  mode="single"
                  onSelect={(date) =>
                    date && handleFilterChange("initialDate", date)
                  }
                  selected={filters.initialDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="final-date">
              Data Final
            </label>
            <Popover>
              <PopoverTrigger>
                <Button
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.finalDate && "text-muted-foreground"
                  )}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.finalDate ? (
                    format(filters.finalDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="single"
                  onSelect={(date) =>
                    date && handleFilterChange("finalDate", date)
                  }
                  selected={filters.finalDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtros Adicionais */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="seller-id">
              Vendedor
            </label>
            <Select
              onValueChange={(value) =>
                handleFilterChange(
                  "sellerId",
                  !value || value === "all" ? undefined : Number.parseInt(value)
                )
              }
              value={filters.sellerId?.toString() || "all"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {/* Aqui você pode adicionar a lista de vendedores */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="client-id">
              Cliente
            </label>
            <Select
              onValueChange={(value) =>
                handleFilterChange(
                  "clientId",
                  !value || value === "all" ? undefined : Number.parseInt(value)
                )
              }
              value={filters.clientId?.toString() || "all"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {/* Aqui você pode adicionar a lista de clientes */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="category-id">
              Categoria
            </label>
            <Select
              onValueChange={(value) =>
                handleFilterChange(
                  "categoryId",
                  !value || value === "all" ? undefined : Number.parseInt(value)
                )
              }
              value={filters.categoryId?.toString() || "all"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {/* Aqui você pode adicionar a lista de categorias */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="status">
            Status
          </label>
          <Select
            onValueChange={(value) =>
              handleFilterChange("status", value ?? "all")
            }
            value={filters.status}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-2">
          <Button onClick={resetFilters} variant="outline">
            Limpar Filtros
          </Button>
          <Button onClick={applyFilters}>Aplicar Filtros</Button>
        </div>

        {/* Filtros Específicos para Produtos Mais Vendidos */}
        {reportId === "products" && (
          <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="search-term">
                Buscar Produto
              </label>
              <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(e) =>
                    handleFilterChange("searchTerm", e.target.value)
                  }
                  placeholder="Nome ou código..."
                  value={filters.searchTerm || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="limit">
                Exibir
              </label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange(
                    "limit",
                    value ? Number.parseInt(value) : 10
                  )
                }
                value={filters.limit?.toString() || "10"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="orderBy">
                Ordenar por
              </label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange("orderBy", value ?? "value")
                }
                value={filters.orderBy || "value"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Valor Total</SelectItem>
                  <SelectItem value="quantity">Quantidade Vendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
