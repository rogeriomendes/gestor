"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  Building2Icon,
  ClockIcon,
  DotIcon,
  FileTextIcon,
  LandmarkIcon,
  XIcon,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { NfButton } from "@/components/nf-button";
import { NfeAccessKey } from "@/components/nfe-access-key";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCNPJ } from "@/lib/format-cnpj";
import { formatDate } from "@/lib/format-date";
import { trpc } from "@/utils/trpc";
import { DetailEntryCharge } from "./DetailEntryCharge";
import { DetailEntryInformation } from "./DetailEntryInformation";
import { DetailEntryProducts } from "./DetailEntryProducts";
import { DetailEntryTotals } from "./DetailEntryTotals";

export function DetailEntry({
  entryID,
  billsPayID,
  open,
  onOpenChange,
}: {
  entryID: number;
  billsPayID?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();

  const invoiceEntryQuery = useQuery({
    ...trpc.tenant.invoiceEntry.byId.queryOptions({ id: entryID }),
    enabled: !!tenant && (open ?? true),
  });

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {invoiceEntryQuery.isPending ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <Popover>
                <PopoverTrigger className="flex items-center text-left font-normal uppercase">
                  {
                    invoiceEntryQuery.data?.invoiceEntry?.fornecedor?.pessoa
                      .NOME
                  }
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Fornecedor
                </PopoverContent>
              </Popover>
            )}
          </CredenzaTitle>
          <CredenzaDescription>
            <div className="flex flex-col space-y-1">
              {invoiceEntryQuery.isPending ? (
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </>
              ) : (
                <>
                  {invoiceEntryQuery.data?.invoiceEntry?.fornecedor?.pessoa
                    ?.pessoa_juridica?.[0]?.CNPJ && (
                    <div className="flex flex-row items-center space-x-0.5">
                      <Popover>
                        <PopoverTrigger className="flex items-center">
                          <Building2Icon className="mr-2 size-4" />
                          {formatCNPJ(
                            invoiceEntryQuery.data?.invoiceEntry?.fornecedor
                              ?.pessoa?.pessoa_juridica?.[0]?.CNPJ
                          )}
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          <div className="flex flex-col space-y-1">
                            <span>CNPJ do fornecedor</span>
                            <div className="flex items-center pt-2">
                              <CopyButton
                                text="Copiar CNPJ"
                                value={
                                  invoiceEntryQuery.data?.invoiceEntry
                                    ?.fornecedor?.pessoa?.pessoa_juridica?.[0]
                                    ?.CNPJ
                                }
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {invoiceEntryQuery.data?.invoiceEntry?.CHAVE_ACESSO && (
                    <div className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger className="flex items-center">
                          <BarcodeIcon className="mr-2 size-4" />
                          <NfeAccessKey
                            accessKey={
                              invoiceEntryQuery.data?.invoiceEntry?.CHAVE_ACESSO
                            }
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          <div className="flex flex-col space-y-1">
                            <span>Chave de acesso da NFe</span>
                            <div className="flex flex-col space-y-2 pt-2">
                              <CopyButton
                                text="Copiar chave de acesso"
                                value={
                                  invoiceEntryQuery.data?.invoiceEntry
                                    ?.CHAVE_ACESSO
                                }
                              />
                              <NfButton
                                chaveAcesso={
                                  invoiceEntryQuery.data?.invoiceEntry
                                    ?.CHAVE_ACESSO || ""
                                }
                                tipo="nfe"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  <div className="flex flex-row items-center">
                    <Popover>
                      <PopoverTrigger className="flex items-center">
                        <LandmarkIcon className="mr-2 size-4" />
                        {
                          invoiceEntryQuery.data?.invoiceEntry?.empresa
                            ?.RAZAO_SOCIAL
                        }
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Empresa
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-row items-center">
                    <Popover>
                      <PopoverTrigger className="flex items-center">
                        <FileTextIcon className="mr-2 size-4" />
                        NFe {invoiceEntryQuery.data?.invoiceEntry?.NUMERO}
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Número da NFe
                      </PopoverContent>
                    </Popover>
                    <DotIcon />
                    <Popover>
                      <PopoverTrigger className="flex items-center">
                        <ClockIcon className="mr-2 size-4" />
                        {invoiceEntryQuery.data?.invoiceEntry?.DATA_EMISSAO &&
                          formatDate(
                            new Date(
                              invoiceEntryQuery.data.invoiceEntry.DATA_EMISSAO
                            )
                          )}
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Data de emissão
                      </PopoverContent>
                    </Popover>
                    <DotIcon />
                    <Popover>
                      <PopoverTrigger className="flex items-center">
                        <ClockIcon className="mr-2 size-4" />
                        {invoiceEntryQuery.data?.invoiceEntry
                          ?.DATA_ENTRADA_SAIDA &&
                          formatDate(
                            new Date(
                              invoiceEntryQuery.data?.invoiceEntry
                                ?.DATA_ENTRADA_SAIDA ?? ""
                            )
                          )}{" "}
                        {
                          invoiceEntryQuery.data?.invoiceEntry
                            ?.HORA_ENTRADA_SAIDA
                        }
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Data de entrada
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {invoiceEntryQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <Tabs className="w-full" defaultValue="products">
              <TabsList className="mb-1">
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="charge">Cobrança</TabsTrigger>
                <TabsTrigger value="totals">Totais</TabsTrigger>
                <TabsTrigger value="information">Informações</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <DetailEntryProducts entryID={entryID} />
              </TabsContent>
              <TabsContent value="charge">
                {invoiceEntryQuery.data?.invoiceEntry && (
                  <DetailEntryCharge
                    billsPayID={billsPayID}
                    entryData={invoiceEntryQuery.data?.invoiceEntry}
                  />
                )}
              </TabsContent>
              <TabsContent value="totals">
                {invoiceEntryQuery.data?.invoiceEntry && (
                  <DetailEntryTotals
                    entryData={invoiceEntryQuery.data?.invoiceEntry}
                  />
                )}
              </TabsContent>
              <TabsContent value="information">
                {invoiceEntryQuery.data?.invoiceEntry && (
                  <DetailEntryInformation
                    entryData={invoiceEntryQuery.data?.invoiceEntry}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
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
