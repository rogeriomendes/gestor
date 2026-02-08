import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, User } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import isActive from "@/lib/is-active";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type ClientItem = RouterOutputs["tenant"]["client"]["all"]["client"][number];

export default function ReceiveClientsLinks() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const clientsQuery = useQuery({
    ...trpc.tenant.client.all.queryOptions({
      searchTerm: search,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant,
  });

  return (
    <>
      <SearchInput
        className="w-full md:w-full lg:w-full"
        enableF9Shortcut
        icon={<User className="size-4" />}
        onChange={setSearch}
        placeholder="Pesquisar cliente"
        value={search}
      />
      {clientsQuery.isLoading ? (
        <div className="mt-2 grid gap-1 md:mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="mt-2 grid gap-1 md:mt-4">
          <Link
            className={cn(
              "group/link flex flex-row items-center justify-between rounded-md p-3 text-xs transition-colors hover:bg-accent focus:bg-accent focus:outline-none active:bg-accent md:text-sm",
              searchParams.size === 0 ? "bg-accent" : ""
            )}
            href={pathname}
          >
            TODOS
            <ChevronRightIcon
              className={cn(
                "group/icon size-4 text-muted-foreground group-hover/link:visible",
                searchParams.size === 0 ? "visible" : "invisible"
              )}
            />
          </Link>
          {clientsQuery.data?.client
            .filter((client: ClientItem) => {
              if (search) {
                return client.pessoa.NOME?.toString()
                  .toUpperCase()
                  .includes(search.toUpperCase());
              }
              return true;
            })
            .map((client: ClientItem) => (
              <Link
                className={cn(
                  "group/link flex flex-row items-center justify-between rounded-md p-3 text-xs transition-colors hover:bg-accent focus:bg-accent focus:outline-none md:text-sm",
                  isActive(
                    `${pathname}?clientId=${client.ID}`,
                    pathname,
                    searchParams
                  )
                    ? "bg-accent"
                    : ""
                )}
                href={`${pathname}?clientId=${client.ID}` as Route}
                key={client.ID}
              >
                {client.pessoa.NOME}
                <ChevronRightIcon
                  className={cn(
                    "group/icon size-4 text-muted-foreground group-hover/link:visible",
                    isActive(
                      `${pathname}?clientId=${client.ID}`,
                      pathname,
                      searchParams
                    )
                      ? "visible"
                      : "invisible"
                  )}
                />
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
