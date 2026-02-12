import { useQuery } from "@tanstack/react-query";
import {
  BanknoteIcon,
  CornerDownLeftIcon,
  CreditCardIcon,
  HandshakeIcon,
  MinusIcon,
  PanelBottomCloseIcon,
  PanelBottomIcon,
  PanelBottomOpenIcon,
  SheetIcon,
  TicketCheckIcon,
  TicketIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DetailBudget } from "@/app/(tenant)/sales/budget/_components/DetailBudget";
import { DetailSales } from "@/app/(tenant)/sales/list/_components/DetailSales";
import { PixIcon } from "@/assets/PixIcon";
import { ShowText } from "@/components/show-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import type { ClosingData } from "../types";
import { PaymentAccordionItem } from "./PaymentAccordionItem";
import { PaymentLineItem } from "./PaymentLineItem";

type AmountByIdData = RouterOutputs["tenant"]["financialClosing"]["amountById"];
type GroupedPaymentItem = NonNullable<
  AmountByIdData["groupedPaymentsAmount"]
>[number];
type GroupedPayments = Record<
  string,
  {
    payments: GroupedPaymentItem[];
    total: number;
  }
>;

interface PaymentType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const typeNames: Record<string, PaymentType> = {
  CA: { name: "CARTÃO", icon: CreditCardIcon },
  CD: { name: "PIX", icon: PixIcon },
  DN: { name: "DINHEIRO", icon: BanknoteIcon },
  VA: { name: "VALE", icon: TicketIcon },
  CH: { name: "CHEQUE", icon: TicketCheckIcon },
};

export default function FinancialClosingPayment({
  closingData,
}: {
  closingData: ClosingData;
}) {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const closingAmountQuery = useQuery({
    ...trpc.tenant.financialClosing.amountById.queryOptions({
      idClosing: Number(closingData?.id),
      dataAbertura: closingData?.dateOpen,
      horaAbertura: closingData?.hourOpen,
      horaFechamento: closingData?.hourClosed,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled:
      !!tenant &&
      !!closingData?.id &&
      closingData.dateOpen != null &&
      closingData.hourOpen != null,
  });

  const groupedPayments = useMemo(() => {
    return closingAmountQuery.data?.groupedPaymentsAmount.reduce(
      (grouped: GroupedPayments, payment: GroupedPaymentItem) => {
        const { TIPO, TOTAL } = payment;
        if (TIPO != null) {
          if (!grouped[TIPO]) {
            grouped[TIPO] = {
              payments: [],
              total: 0,
            };
          }
          grouped[TIPO].payments.push(payment);
          grouped[TIPO].total += TOTAL;
        }
        return grouped;
      },
      {}
    );
  }, [closingAmountQuery.data?.groupedPaymentsAmount]);

  const orderedGroupedPayments = useMemo(() => {
    return Object.keys(typeNames).filter(
      (tipo) => groupedPayments && tipo in groupedPayments
    );
  }, [groupedPayments]);

  return (
    <>
      {closingAmountQuery.isLoading ? (
        <Accordion className="w-full" multiple>
          {Array.from({ length: 6 }).map((_, index) => (
            <AccordionItem key={index} value={`skeleton-${index}`}>
              <AccordionTrigger>
                <div className="flex items-center">
                  <div className="mr-4 flex flex-row items-center">
                    <Skeleton className="mr-2 h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="mx-1.5 space-y-2">
                <div className="flex flex-row justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-row justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <>
          <Accordion className="w-full" multiple>
            <PaymentAccordionItem
              amount={
                closingAmountQuery.data
                  ? formatAsCurrency(
                      closingAmountQuery.data?.paymentsDnAmount +
                        closingAmountQuery.data?.supplyAmount -
                        closingAmountQuery.data?.sangriaAmount -
                        closingAmountQuery.data?.devolutionDnAmount
                    )
                  : ""
              }
              icon={PanelBottomIcon}
              title="DINHEIRO GAVETA"
              value="GV"
            >
              {closingAmountQuery.data?.paymentsDnAmount !== 0 && (
                <PaymentLineItem
                  amount={formatAsCurrency(
                    Number(closingAmountQuery.data?.paymentsDnAmount)
                  )}
                  label="DINHEIRO"
                />
              )}
              {closingAmountQuery.data?.supplyAmount !== 0 && (
                <PaymentLineItem
                  amount={formatAsCurrency(
                    Number(closingAmountQuery.data?.supplyAmount)
                  )}
                  label="SUPRIMENTO"
                  prefix="+"
                />
              )}
              {closingAmountQuery.data?.sangriaAmount !== 0 && (
                <PaymentLineItem
                  amount={formatAsCurrency(
                    Number(closingAmountQuery.data?.sangriaAmount)
                  )}
                  label="SANGRIA"
                  prefix="-"
                />
              )}
              {(closingAmountQuery.data?.devolutionDnAmount ?? 0) > 0 && (
                <PaymentLineItem
                  amount={formatAsCurrency(
                    Number(closingAmountQuery.data?.devolutionDnAmount)
                  )}
                  label="DEVOLUÇÃO"
                  prefix="-"
                />
              )}
            </PaymentAccordionItem>
            {orderedGroupedPayments.map((tipo) => {
              const { payments, total } = groupedPayments?.[tipo] || {
                payments: [],
                total: 0,
              };
              const sortedPayments = payments
                ?.slice()
                .sort((a: GroupedPaymentItem, b: GroupedPaymentItem) =>
                  (a.DESCRICAO || "").localeCompare(b.DESCRICAO || "")
                );
              const Icon = typeNames[tipo]?.icon;
              return (
                <PaymentAccordionItem
                  amount={formatAsCurrency(Number(total))}
                  icon={Icon}
                  key={tipo}
                  title={typeNames[tipo]?.name || ""}
                  value={tipo}
                >
                  {sortedPayments?.map((payment: GroupedPaymentItem) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(payment.TOTAL)}
                      key={payment.ID}
                      label={payment.DESCRICAO || ""}
                    />
                  ))}
                </PaymentAccordionItem>
              );
            })}
            {closingAmountQuery.data?.supplyAmount !== 0 && (
              <PaymentAccordionItem
                amount={`+${formatAsCurrency(
                  Number(closingAmountQuery.data?.supplyAmount)
                )}`}
                icon={PanelBottomCloseIcon}
                title="SUPRIMENTO"
                value="SU"
              >
                {closingAmountQuery.data?.supply
                  .sort(
                    (
                      a: AmountByIdData["supply"][number],
                      b: AmountByIdData["supply"][number]
                    ) => b.ID - a.ID
                  )
                  .map((supply: AmountByIdData["supply"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(Number(supply.VALOR_RECEBIDO))}
                      key={supply.ID}
                      label={supply.HISTORICO}
                      prefix="+"
                    >
                      <Badge
                        className="mr-2 w-[70px] justify-center"
                        variant="outline"
                      >
                        {supply.HORA_RECEBIMENTO}
                      </Badge>
                    </PaymentLineItem>
                  ))}
              </PaymentAccordionItem>
            )}
            {closingAmountQuery.data?.sangriaAmount !== 0 && (
              <PaymentAccordionItem
                amount={`-${formatAsCurrency(
                  Number(closingAmountQuery.data?.sangriaAmount)
                )}`}
                icon={PanelBottomOpenIcon}
                title="SANGRIA"
                value="SA"
              >
                {closingAmountQuery.data?.sangria.map(
                  (sangria: AmountByIdData["sangria"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(Number(sangria.VALOR_PAGO))}
                      key={sangria.ID}
                      label={sangria.HISTORICO}
                      prefix="-"
                    >
                      <Badge
                        className="mr-2 w-[70px] justify-center"
                        variant="outline"
                      >
                        {sangria.HORA_PAGAMENTO}
                      </Badge>
                    </PaymentLineItem>
                  )
                )}
              </PaymentAccordionItem>
            )}
            {closingAmountQuery.data?.installmentsAmount !== 0 && (
              <PaymentAccordionItem
                amount={formatAsCurrency(
                  Number(closingAmountQuery.data?.installmentsAmount)
                )}
                className="space-y-0"
                icon={HandshakeIcon}
                title="PARCELADO"
                value="PA"
              >
                {closingAmountQuery.data?.installments.map(
                  (installments: AmountByIdData["installments"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(
                        Number(installments.VALOR_TOTAL)
                      )}
                      key={installments.ID}
                      label={installments.PDV_CLIENTE_NOME}
                      onClick={() => {
                        setSelectedSaleId(installments.ID);
                        setIsSalesModalOpen(true);
                      }}
                    >
                      <Badge
                        className="mr-2 w-[70px] justify-center"
                        variant="outline"
                      >
                        {installments.HORA_SAIDA}
                      </Badge>
                    </PaymentLineItem>
                  )
                )}
              </PaymentAccordionItem>
            )}
            {closingAmountQuery.data?.budgetAmount !== 0 && (
              <PaymentAccordionItem
                amount={formatAsCurrency(
                  Number(closingAmountQuery.data?.budgetAmount)
                )}
                className="space-y-0"
                color="text-yellow-500"
                icon={SheetIcon}
                title="ORÇAMENTO / PEDIDO"
                value="OP"
              >
                <div className="mb-4 text-xs text-yellow-500">
                  Serão listados apenas os pedidos em digitação do dia.
                </div>
                {closingAmountQuery.data?.budget?.map(
                  (budget: AmountByIdData["budget"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(Number(budget.VALOR_TOTAL))}
                      key={budget.ID}
                      label=""
                      onClick={() => {
                        setSelectedBudgetId(budget.ID);
                        setIsBudgetModalOpen(true);
                      }}
                    >
                      {budget.vendedor?.colaborador?.pessoa?.NOME}
                    </PaymentLineItem>
                  )
                )}
              </PaymentAccordionItem>
            )}
            {closingAmountQuery.data?.devolutionAmount !== 0 && (
              <PaymentAccordionItem
                amount={formatAsCurrency(
                  Number(closingAmountQuery.data?.devolutionAmount)
                )}
                className="space-y-0"
                color="text-red-500"
                icon={CornerDownLeftIcon}
                title="DEVOLUÇÃO"
                value="DV"
              >
                {closingAmountQuery.data?.devolution?.map(
                  (devolution: AmountByIdData["devolution"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(Number(devolution.VALOR_TOTAL))}
                      key={devolution.ID}
                      label={devolution.MOTIVO?.toUpperCase() || ""}
                      onClick={() => {
                        setSelectedSaleId(devolution.ID);
                        setIsSalesModalOpen(true);
                      }}
                    >
                      <Badge
                        className="mr-2 w-[70px] justify-center"
                        variant="outline"
                      >
                        {devolution.HORA_SAIDA}
                      </Badge>
                    </PaymentLineItem>
                  )
                )}
              </PaymentAccordionItem>
            )}
            {(closingAmountQuery.data?.discount?.length || 0) > 0 && (
              <PaymentAccordionItem
                amount={formatAsCurrency(
                  Number(closingAmountQuery.data?.discountAmount)
                )}
                className="space-y-0"
                color="text-red-500"
                icon={MinusIcon}
                title="DESCONTO"
                value="DA"
              >
                {closingAmountQuery.data?.discount?.map(
                  (discount: AmountByIdData["discount"][number]) => (
                    <PaymentLineItem
                      amount={formatAsCurrency(Number(discount.VALOR_DESCONTO))}
                      key={discount.ID}
                      label=""
                      onClick={() => {
                        setSelectedSaleId(discount.ID);
                        setIsSalesModalOpen(true);
                      }}
                    >
                      <Badge
                        className="mx-2 w-[70px] justify-center"
                        variant="outline"
                      >
                        {discount.HORA_SAIDA}
                      </Badge>
                      <div className="mx-2">
                        {discount.vendedor?.colaborador?.pessoa?.NOME}
                      </div>
                    </PaymentLineItem>
                  )
                )}
              </PaymentAccordionItem>
            )}
          </Accordion>
          <div className="mt-4 flex items-center justify-between text-base md:text-lg">
            <div className="mr-4">TOTAL DE VENDAS</div>
            <div className="mr-1">
              <ShowText>
                {formatAsCurrency(
                  Number(closingAmountQuery.data?.groupedPaymentsTotalAmount) +
                    Number(closingAmountQuery.data?.installmentsAmount)
                )}
              </ShowText>
            </div>
          </div>
        </>
      )}

      {/* Modal do DetailBudget */}
      {selectedBudgetId && (
        <DetailBudget
          budgetId={selectedBudgetId}
          onOpenChange={(open) => {
            setIsBudgetModalOpen(open);
            if (!open) {
              setSelectedBudgetId(null);
            }
          }}
          open={isBudgetModalOpen}
        />
      )}

      {/* Modal do DetailSales */}
      {selectedSaleId && (
        <DetailSales
          onOpenChange={(open) => {
            setIsSalesModalOpen(open);
            if (!open) {
              setSelectedSaleId(null);
            }
          }}
          open={isSalesModalOpen}
          saleId={selectedSaleId}
        />
      )}
    </>
  );
}
