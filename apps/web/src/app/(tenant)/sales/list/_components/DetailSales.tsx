import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  ClockIcon,
  FileSearchIcon,
  InfoIcon,
  LandmarkIcon,
  SheetIcon,
  SquareUserIcon,
  TriangleAlertIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { NfButton } from "@/components/nf-button";
import { NfeAccessKey } from "@/components/nfe-access-key";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { DetailBudget } from "../../budget/_components/DetailBudget";
import { DetailSalesProducts } from "./DetailSalesProducts";
import { NfcePrintPreview } from "./NfcePrintPreview";
import { PaymentSales } from "./PaymentSales";

function normalizeXmlNfe(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }

  if (
    value &&
    typeof value === "object" &&
    "length" in value &&
    typeof (value as { length: unknown }).length === "number"
  ) {
    try {
      return new TextDecoder().decode(
        Uint8Array.from(value as ArrayLike<number>)
      );
    } catch {
      return "";
    }
  }

  return "";
}

export function DetailSales({
  saleId,
  fromBudget,
  open,
  onOpenChange,
}: {
  saleId: number | null | undefined;
  fromBudget?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isNfcePreviewOpen, setIsNfcePreviewOpen] = useState(false);

  const {
    data: saleData,
    isPending: saleIsPending,
    error: saleError,
  } = useQuery({
    ...trpc.tenant.sales.byId.queryOptions({ id: saleId }),
    enabled: !!tenant && saleId != null,
  });

  const statusInfo = getNfceStatusInfo({
    devolucao: saleData?.sales?.DEVOLUCAO,
    canceladoIdUsuario: saleData?.sales?.CANCELADO_ID_USUARIO,
    nfeStatus: saleData?.sales?.nfe_cabecalho[0]?.STATUS_NOTA ?? null,
  });

  const xmlNfe = normalizeXmlNfe(
    saleData?.sales?.nfe_cabecalho[0]?.XML_NFE_TEXT ??
      saleData?.sales?.nfe_cabecalho[0]?.XML_NFE
  );

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <div className="flex flex-row items-center">
              {saleIsPending ? (
                <>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="ml-2 h-5 w-20" />
                  <Skeleton className="ml-2 h-5 w-24" />
                </>
              ) : saleError ? (
                "Erro ao carregar venda"
              ) : (
                <>
                  <div className="flex items-center">
                    Venda #{saleData?.sales?.ID}
                    {saleData?.sales?.NFCE === "S" && (
                      <span className="ml-2 text-muted-foreground text-sm">
                        NFC-e{" "}
                        {removeLeadingZero(String(saleData?.sales?.NUMERO_NFE))}
                      </span>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      statusInfo.color,
                      "ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                    )}
                    variant={statusInfo.variant}
                  >
                    {statusInfo.label}
                  </Badge>
                </>
              )}
            </div>
          </CredenzaTitle>
          <CredenzaDescription>
            <div className="flex flex-col space-y-1">
              {saleIsPending ? (
                <span className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-40" />
                </span>
              ) : saleError ? (
                "Não foi possível carregar os dados da venda. Tente novamente."
              ) : (
                <>
                  <span className="flex items-center">
                    <LandmarkIcon className="mr-2 size-4" />
                    Empresa:{" "}
                    {saleData?.sales?.nfe_cabecalho[0]?.empresa?.RAZAO_SOCIAL
                      ? saleData?.sales?.nfe_cabecalho[0]?.empresa?.RAZAO_SOCIAL
                      : saleData?.sales?.empresa?.RAZAO_SOCIAL || "—"}
                  </span>
                  {saleData?.sales?.nfe_cabecalho[0]?.CHAVE_ACESSO && (
                    <span className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger>
                          <span className="flex cursor-pointer items-center">
                            <BarcodeIcon className="mr-2 size-4" />
                            Chave:{" "}
                            <span className="ml-1">
                              <NfeAccessKey
                                accessKey={
                                  saleData?.sales?.nfe_cabecalho[0]
                                    ?.CHAVE_ACESSO
                                }
                              />
                            </span>
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          <span className="flex flex-col space-y-1">
                            <span>Chave de acesso da NFCe</span>
                            <span className="flex flex-col space-y-2 pt-2">
                              <CopyButton
                                text="Copiar chave de acesso"
                                value={
                                  saleData?.sales?.nfe_cabecalho[0]
                                    ?.CHAVE_ACESSO
                                }
                              />
                              {xmlNfe && (
                                <Button
                                  className={cn(
                                    "h-6 cursor-pointer justify-start px-2 [&_svg]:size-3"
                                  )}
                                  onClick={() => setIsNfcePreviewOpen(true)}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <FileSearchIcon />
                                  <span className="text-muted-foreground text-xs">
                                    Visualizar DANFE NFC-e
                                  </span>
                                </Button>
                              )}
                              <NfButton
                                chaveAcesso={
                                  saleData?.sales?.nfe_cabecalho[0]
                                    ?.CHAVE_ACESSO || ""
                                }
                                tipo="nfce"
                              />
                            </span>
                          </span>
                        </PopoverContent>
                      </Popover>
                    </span>
                  )}
                  <div className="grid grid-cols-2 gap-1 md:grid-cols-2">
                    <span className="flex items-center">
                      <SquareUserIcon className="mr-2 size-4" />
                      Conta caixa: {saleData?.sales?.conta_caixa?.NOME || "—"}
                    </span>
                    <span className="flex items-center">
                      <UserIcon className="mr-2 size-4" />
                      Vendedor:{" "}
                      {saleData?.sales?.vendedor?.colaborador?.pessoa?.NOME ||
                        "—"}
                    </span>
                    <span className="flex items-center">
                      <UserIcon className="mr-2 size-4" />
                      Cliente: {saleData?.sales?.cliente?.pessoa?.NOME || "—"}
                    </span>
                    {saleData?.sales?.ID_VENDA_ORCAMENTO_CABECALHO && (
                      <span className="flex items-center">
                        <SheetIcon className="mr-2 size-4" />
                        Orçamento #
                        {saleData?.sales?.ID_VENDA_ORCAMENTO_CABECALHO}
                      </span>
                    )}
                    <span className="col-span-2 flex items-center md:col-span-1">
                      <ClockIcon className="mr-2 size-4" />
                      Data da venda:{" "}
                      {saleData?.sales?.DATA_VENDA
                        ? `${formatDate(saleData?.sales?.DATA_VENDA)} ${saleData?.sales?.HORA_SAIDA ?? ""}`.trim()
                        : "—"}
                    </span>
                  </div>
                  {xmlNfe && (
                    <div className="flex flex-row items-center">
                      <Button
                        className="pl-0"
                        onClick={() => setIsNfcePreviewOpen(true)}
                        size="xs"
                        variant="link"
                      >
                        <FileSearchIcon className="size-4" />
                        Visualizar DANFE NFC-e
                      </Button>
                    </div>
                  )}
                  {!fromBudget &&
                    saleData?.sales?.ID_VENDA_ORCAMENTO_CABECALHO && (
                      <div className="flex flex-row items-center">
                        <Button
                          className="pl-0"
                          onClick={() => setIsBudgetModalOpen(true)}
                          size="xs"
                          variant="link"
                        >
                          <SheetIcon className="size-4" />
                          Visualizar orçamento/pedido
                        </Button>
                        <DetailBudget
                          budgetId={
                            saleData?.sales?.ID_VENDA_ORCAMENTO_CABECALHO
                          }
                          fromSales
                          onOpenChange={setIsBudgetModalOpen}
                          open={isBudgetModalOpen}
                        />
                      </div>
                    )}
                </>
              )}
            </div>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {saleIsPending ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : saleError ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Erro: {saleError.message}</p>
            </div>
          ) : (
            <>
              {saleData?.sales?.nfe_cabecalho[0]?.STATUS_NOTA === "7" && (
                <Alert className="mb-2 break-all" variant="warning">
                  <TriangleAlertIcon className="size-4" />
                  <AlertTitle>Motivo da Rejeição</AlertTitle>
                  <AlertDescription className="max-w-full break-all">
                    {saleData?.sales?.nfe_cabecalho[0]?.RETORNO_CODIGO === "0"
                      ? "Falha desconhecida ao tentar autorizar o NFC-e."
                      : `${saleData?.sales?.nfe_cabecalho[0]?.RETORNO_CODIGO}: ${saleData?.sales?.nfe_cabecalho[0]?.RETORNO_MOTIVO}`}
                  </AlertDescription>
                </Alert>
              )}
              {(saleData?.sales?.DEVOLUCAO === "S" ||
                saleData?.sales?.CANCELADO_ID_USUARIO) && (
                <Alert className="mb-2 break-all" variant="danger">
                  <InfoIcon className="size-4" />
                  <AlertTitle>Motivo</AlertTitle>
                  <AlertDescription>{saleData?.sales?.MOTIVO}</AlertDescription>
                </Alert>
              )}
              {saleData?.sales?.OBSERVACAO &&
                saleData?.sales?.OBSERVACAO !== "Devolução " && (
                  <Alert className="mb-2 break-all" variant="info">
                    <InfoIcon className="size-4" />
                    <AlertTitle>Observação</AlertTitle>
                    <AlertDescription>
                      {saleData?.sales?.OBSERVACAO}
                    </AlertDescription>
                  </Alert>
                )}
              <Card
                className="rounded-md data-[size=sm]:py-1 data-[size=sm]:md:py-2"
                size="sm"
              >
                <CardContent className="group-data-[size=sm]/card:px-1 group-data-[size=sm]/card:md:px-2">
                  <DetailSalesProducts saleId={saleId} />
                  <Separator className="mt-1 mb-4 md:mt-2" />
                  <div className="mt-3 text-sm md:text-base">
                    <div className="mx-3 mb-2 flex justify-between">
                      <div>Valor dos Produtos</div>
                      <div>
                        {formatAsCurrency(
                          Number(saleData?.sales?.VALOR_SUBTOTAL)
                        )}
                      </div>
                    </div>
                    {saleData?.sales?.VALOR_DESCONTO &&
                      Number(saleData?.sales?.VALOR_DESCONTO) !== 0 && (
                        <div className="mx-3 mb-2 flex justify-between">
                          <div>Desconto</div>
                          <div>
                            {formatAsCurrency(
                              Number(saleData?.sales?.VALOR_DESCONTO)
                            )}
                          </div>
                        </div>
                      )}
                    {saleData?.sales?.VALOR_ACRESCIMO &&
                      Number(saleData?.sales?.VALOR_ACRESCIMO) !== 0 && (
                        <div className="mx-3 mb-2 flex justify-between">
                          <div>Acréscimo</div>
                          <div>
                            {formatAsCurrency(
                              Number(saleData?.sales?.VALOR_ACRESCIMO)
                            )}
                          </div>
                        </div>
                      )}
                    <Separator className="mt-4 mb-4" />
                    <div className="mx-3 mb-2 flex justify-between">
                      <div>
                        Valor a{" "}
                        {saleData?.sales?.DEVOLUCAO === "S"
                          ? "Devolver"
                          : "Pagar"}
                      </div>
                      <div>
                        {formatAsCurrency(Number(saleData?.sales?.VALOR_TOTAL))}
                      </div>
                    </div>
                    <div className="mt-2 mb-2 ml-auto space-y-1">
                      {saleData?.sales?.venda_recebimento.map((payment, i) => (
                        <PaymentSales
                          key={i}
                          paymentData={
                            payment as Parameters<
                              typeof PaymentSales
                            >[0]["paymentData"]
                          }
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CredenzaBody>
        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-3 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
        <Credenza onOpenChange={setIsNfcePreviewOpen} open={isNfcePreviewOpen}>
          <CredenzaContent>
            <CredenzaHeader>
              <CredenzaTitle>Visualizar DANFE NFC-e</CredenzaTitle>
              <CredenzaDescription>
                Visualização de impressão da NFC-e
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <NfcePrintPreview
                consumerDocument={saleData?.sales?.PDV_CLIENTE_CPF_CNPJ}
                consumerName={saleData?.sales?.PDV_CLIENTE_NOME}
                sellerName={
                  saleData?.sales?.vendedor?.colaborador?.pessoa?.NOME
                }
                unitFractionRules={
                  saleData?.sales?.unitFractionRules ?? undefined
                }
                valorTroco={saleData?.sales?.venda_recebimento?.reduce(
                  (sum, r) => sum + (Number(r.VALOR_TROCO) || 0),
                  0
                )}
                xml={xmlNfe}
              />
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>
      </CredenzaContent>
    </Credenza>
  );
}
