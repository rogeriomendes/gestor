import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  Building2Icon,
  ClockIcon,
  DotIcon,
  FileTextIcon,
  FileXIcon,
  GitCompareArrowsIcon,
  LandmarkIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import xml2js from "xml2js";
import { CopyButton } from "@/components/copy-button";
import { NfButton } from "@/components/nf-button";
import { NfeAccessKey } from "@/components/nfe-access-key";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { decodeDocXml } from "@/lib/decode-doc-xml";
import { formatCNPJ } from "@/lib/format-cnpj";
import { formatDate } from "@/lib/format-date";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailDfeCharge } from "./DetailDfeCharge";
import { DetailDfeInformation } from "./DetailDfeInformation";
import { DetailDfeProducts } from "./DetailDfeProducts";
import { DetailDfeTotals } from "./DetailDfeTotals";

export interface NFeXML {
  nfeProc: {
    NFe: {
      infNFe: NFeInfo;
    };
  };
}

export interface NFeInfo {
  ide: Ide;
  det: ProdutoDetalhe | ProdutoDetalhe[];
  total: Total;
  cobr?: Cobranca;
  infAdic?: InfAdic;
}

export interface Cobranca {
  fat?: Fatura;
  dup?: Duplicata | Duplicata[];
}

export interface Fatura {
  nFat: string;
  vOrig: string;
  vDesc?: string;
  vLiq: string;
}

export interface Duplicata {
  nDup: string;
  dVenc: string;
  vDup: string;
}

export interface Ide {
  natOp: string;
  dhSaiEnt: Date;
}

export interface ProdutoDetalhe {
  prod: Produto;
}

export interface Produto {
  xProd: string;
  cProd: string;
  qCom: string;
  uCom: string;
  vUnCom: string;
  vProd: string;
}

export interface Total {
  ICMSTot: ICMSTot;
}

export interface ICMSTot {
  vICMS: string;
  vST: string;
  vFCP: string;
  vFCPST: string;
  vIPI: string;
  vDesc: string;
  vFrete: string;
  vSeg: string;
  vOutro: string;
}

export interface InfAdic {
  infCpl?: string;
  infAdFisco?: string;
}

type InvoiceDfeByIdItem =
  RouterOutputs["tenant"]["invoiceDfe"]["byId"]["invoiceDfe"][number];

export function DetailDfe({
  entryID,
  open,
  onOpenChange,
}: {
  entryID: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const [nfe, setNfe] = useState<NFeInfo | null>(null);

  const invoiceEntryQuery = useQuery({
    ...trpc.tenant.invoiceDfe.byId.queryOptions({ id: entryID }),
    enabled: !!tenant && !!entryID && !!open,
  });
  const invoice: InvoiceDfeByIdItem | undefined =
    invoiceEntryQuery.data?.invoiceDfe?.[0];

  const xml = decodeDocXml(invoice?.DOCXML);

  // Resetar nfe quando entryID mudar
  useEffect(() => {
    setNfe(null);
  }, [entryID]);

  useEffect(() => {
    if (!xml) return;

    const parser = new xml2js.Parser({ explicitArray: false });

    parser
      .parseStringPromise(xml)
      .then((result: { nfeProc: { NFe: { infNFe: NFeInfo } } }) => {
        const nfeData = result.nfeProc.NFe.infNFe;
        setNfe(nfeData);
      })
      .catch((error) => console.error("Erro ao processar XML:", error));
  }, [xml]);

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <Popover>
              <PopoverTrigger className="flex items-center text-left font-normal uppercase">
                {invoice?.RAZAO_SOCIAL}
              </PopoverTrigger>
              <PopoverContent className="w-full p-2 text-xs">
                Fornecedor
              </PopoverContent>
            </Popover>
          </CredenzaTitle>
          <CredenzaDescription asChild>
            <div className="flex flex-col space-y-1">
              {invoiceEntryQuery.isPending ? (
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </>
              ) : (
                <>
                  {nfe?.ide.natOp && (
                    <div className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger className="flex items-center text-left uppercase">
                          <GitCompareArrowsIcon className="mr-2 size-4 shrink-0" />
                          {nfe?.ide.natOp.length > 50
                            ? nfe?.ide.natOp.slice(0, 47) + "..."
                            : nfe?.ide.natOp}
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          Natureza da operação
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {invoice?.CNPJ_CPF && (
                    <div className="flex flex-row items-center space-x-0.5">
                      <Popover>
                        <PopoverTrigger className="flex items-center">
                          <Building2Icon className="mr-2 size-4" />
                          {formatCNPJ(invoice?.CNPJ_CPF)}
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          <div className="flex flex-col space-y-1">
                            <span>CNPJ do fornecedor</span>
                            <div className="flex items-center pt-2">
                              <CopyButton
                                text="Copiar CNPJ"
                                value={invoice?.CNPJ_CPF}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {invoice?.CHAVE_ACESSO && (
                    <div className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger className="flex items-center">
                          <BarcodeIcon className="mr-2 size-4" />
                          <NfeAccessKey accessKey={invoice?.CHAVE_ACESSO} />
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          <div className="flex flex-col space-y-1">
                            <span>Chave de acesso da NFe</span>
                            <div className="flex flex-col space-y-2 pt-2">
                              <CopyButton
                                text="Copiar chave de acesso"
                                value={invoice?.CHAVE_ACESSO}
                              />
                              <NfButton
                                chaveAcesso={invoice?.CHAVE_ACESSO || ""}
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
                        <LandmarkIcon className="mr-2 size-4 shrink-0" />
                        {invoice?.empresa?.RAZAO_SOCIAL}
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
                        NFe {invoice?.NUMERO}
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Número da NFe
                      </PopoverContent>
                    </Popover>
                    <DotIcon />
                    <Popover>
                      <PopoverTrigger className="flex items-center">
                        <ClockIcon className="mr-2 size-4" />
                        {invoice?.EMISSAO && formatDate(invoice?.EMISSAO)}
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Data de emissão
                      </PopoverContent>
                    </Popover>
                    {nfe?.ide.dhSaiEnt && (
                      <>
                        <DotIcon />
                        <Popover>
                          <PopoverTrigger className="flex items-center">
                            <ClockIcon className="mr-2 size-4" />
                            {nfe?.ide.dhSaiEnt && formatDate(nfe?.ide.dhSaiEnt)}
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-2 text-xs">
                            Data de saída
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
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
          ) : nfe ? (
            <Tabs className="w-full" defaultValue="products">
              <TabsList className="mb-1">
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="charge">Cobrança</TabsTrigger>
                <TabsTrigger value="totals">Totais</TabsTrigger>
                <TabsTrigger value="information">Informações</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <DetailDfeProducts xml={nfe} />
              </TabsContent>
              <TabsContent value="charge">
                <DetailDfeCharge xml={nfe} />
              </TabsContent>
              <TabsContent value="totals">
                <DetailDfeTotals xml={nfe.total.ICMSTot} />
              </TabsContent>
              <TabsContent value="information">
                <DetailDfeInformation xml={nfe} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="rounded-md py-2 md:py-3">
              <CardContent className="px-2 md:px-3">
                <div className="mx-6 my-8 flex items-center justify-center text-muted-foreground text-sm">
                  <FileXIcon className="mr-5 size-10 md:size-14" />
                  XML não baixado
                </div>
                <div className="flex justify-end px-2">
                  <NfButton
                    chaveAcesso={invoice?.CHAVE_ACESSO || ""}
                    className="h-6 space-x-2 px-2 [&_svg]:size-3"
                    tipo="nfe"
                  />
                </div>
              </CardContent>
            </Card>
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
