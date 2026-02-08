"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { formatCNPJ } from "@/lib/format-cnpj";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function CompanySelector() {
  const { tenant } = useTenant();
  const companyQuery = useQuery({
    ...trpc.tenant.companies.all.queryOptions(),
    enabled: !!tenant?.id,
  });
  const { selectedCompanyId, setSelectedCompanyId, setSelectedCompany } =
    useCompany();

  const companies = companyQuery.data?.company || [];
  const selectedCompany = companies.find((c) => c.ID === selectedCompanyId);

  if (companyQuery.isLoading) {
    return (
      <div className="w-full px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 h-4 animate-pulse rounded bg-muted" />
            <div className="h-3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (companyQuery.isError || !companies.length) {
    return (
      <div className="w-full px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground text-sm">
              Nenhuma empresa encontrada
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className={cn(
              "h-auto w-full cursor-pointer justify-start gap-2 px-2 py-1.5 text-left",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "border-sidebar-accent hover:border-primary/70"
            )}
            variant="ghost"
          >
            <Building2 aria-label="Building" className="size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm">
                {selectedCompanyId === 0
                  ? "Todas as empresas"
                  : selectedCompany?.RAZAO_SOCIAL || "Selecione uma empresa"}
              </div>
              <div className="truncate text-muted-foreground text-xs">
                {selectedCompanyId === 0
                  ? "Visualizar todos os dados"
                  : formatCNPJ(selectedCompany?.CNPJ ?? null) || ""}
              </div>
            </div>
            <ChevronDown
              aria-label="Chevron Down"
              className="ml-auto size-4 shrink-0"
            />
          </Button>
        }
      />

      {/* </DropdownMenuTrigger> */}
      <DropdownMenuContent
        align="start"
        className="min-w-56"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuItem
          className={cn(
            "cursor-pointer",
            "flex flex-col items-start gap-1 p-3",
            selectedCompanyId === 0 && "bg-accent"
          )}
          onClick={() => {
            setSelectedCompanyId(0);
            setSelectedCompany(null);
          }}
        >
          <div className="font-medium text-sm">Todas as empresas</div>
          <div className="text-muted-foreground text-xs">
            Visualizar dados de todas as empresas
          </div>
        </DropdownMenuItem>

        <div className="my-1 border-border border-t" />

        {companies.map((company) => (
          <DropdownMenuItem
            className={cn(
              "flex cursor-pointer flex-col items-start gap-1 p-3",
              selectedCompany?.ID === company.ID && "bg-accent"
            )}
            key={company.ID}
            onClick={() => {
              setSelectedCompanyId(company.ID);
              setSelectedCompany(company);
            }}
          >
            <div className="font-medium text-xs">{company.RAZAO_SOCIAL}</div>
            <div className="text-muted-foreground text-xs">
              {formatCNPJ(company.CNPJ) || ""}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
