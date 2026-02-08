import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  DotIcon,
  InfoIcon,
  LandmarkIcon,
  XIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getSaleStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type saleData =
  RouterOutputs["tenant"]["productsSale"]["all"]["productsSale"][number];

const typeSale: Record<string, string> = {
  1: "Leve/Pague",
  2: "Venda Atacado",
  3: "Promoção",
  4: "Inativo",
};

interface DetailSaleProps {
  saleData: saleData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DetailSale({ saleData, open, onOpenChange }: DetailSaleProps) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const statusInfo = getSaleStatusInfo(saleData.STATUS);

  const saleProductsQuery = useQuery({
    ...trpc.tenant.productsSale.idProduct.queryOptions({ id: saleData.ID }),
    enabled: !!tenant && (open ?? true),
  });

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger>
                  <div className="flex items-center">
                    {saleData.NOME_REAJUSTE}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Nome
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger>
                  <div className="flex items-center">
                    <Badge
                      className={cn(
                        statusInfo.color,
                        "ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                      )}
                      variant={statusInfo.variant}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Status
                </PopoverContent>
              </Popover>
            </div>
          </CredenzaTitle>
          <CredenzaDescription>
            <div className="flex flex-col space-y-1">
              {saleData.ID_EMPRESA && (
                <div className="flex flex-row items-center">
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        <LandmarkIcon className="mr-2 size-4" />
                        {saleData.empresa?.RAZAO_SOCIAL}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Empresa
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="flex flex-row items-center">
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 size-4" />
                      {saleData.DATA_INICIO && formatDate(saleData.DATA_INICIO)}{" "}
                      {saleData.HORA_INICIO}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    Data inicial
                  </PopoverContent>
                </Popover>
                <DotIcon />
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 size-4" />
                      {saleData.DATA_FIM && formatDate(saleData.DATA_FIM)}{" "}
                      {saleData.HORA_FIM}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    Data final
                  </PopoverContent>
                </Popover>
                <DotIcon />
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 size-4" />
                      {saleData.DATA_CADASTRO &&
                        formatDate(saleData.DATA_CADASTRO)}{" "}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    Data criação
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {saleData.OBSERVACAO !== null && saleData.OBSERVACAO.length > 2 && (
            <Alert className="mb-4" variant="info">
              <InfoIcon className="size-4" />
              <AlertTitle>Observação</AlertTitle>
              <AlertDescription>{saleData.OBSERVACAO}</AlertDescription>
            </Alert>
          )}
          <Card className="rounded-md py-1 md:py-2">
            <CardContent className="px-1 md:px-2">
              {saleProductsQuery.isLoading ? (
                <div className="m-2 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  {saleProductsQuery.data?.productsSale.map((sale: any) => (
                    <div
                      className="group rounded-md p-3 transition-colors hover:bg-muted/50"
                      key={sale.ID}
                    >
                      <div className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-xs leading-none md:text-sm">
                            {sale.produto?.NOME}
                          </p>
                          <div className="flex gap-2 text-muted-foreground text-xs md:text-sm">
                            <div className="flex w-64 items-center justify-between">
                              {sale.TIPO_PROMOCAO && (
                                <div>{typeSale[sale.TIPO_PROMOCAO]}</div>
                              )}
                              {sale.QTD_PROMOCAO &&
                                Number(sale.QTD_PROMOCAO) !== 0 && (
                                  <div>
                                    {Number(sale.QTD_PAGAR) !== 0
                                      ? "Leve: " + Number(sale.QTD_PROMOCAO)
                                      : "Qtd.: " + Number(sale.QTD_PROMOCAO)}
                                  </div>
                                )}
                              {sale.QTD_PAGAR &&
                                Number(sale.QTD_PAGAR) !== 0 && (
                                  <div>Pague: {Number(sale.QTD_PAGAR)}</div>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-auto space-y-1">
                          <div className="flex flex-col items-center text-muted-foreground text-xs md:text-sm">
                            {formatAsCurrency(Number(sale.PRECO_ORIGINAL))}
                          </div>
                          <div className="flex flex-col items-center text-xs md:text-sm">
                            {formatAsCurrency(Number(sale.PRECO_PROMOCAO))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </CredenzaBody>
        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-2 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
