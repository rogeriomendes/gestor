"use client";

import { useMemo } from "react";

interface FinancialData {
  accountsReceivable?: {
    accountsReceivable: Array<{
      id: number;
      clientName: string;
      dueDate: Date | null;
      amount: number;
      received: number;
      pending: number;
      isOverdue: boolean | null;
    }>;
  };
  financialSummary?: {
    sales: { total: number; count: number };
    receipts: { total: number };
    payments: { total: number };
    pendingReceivables: { total: number };
    pendingPayables: { total: number };
  };
}

export function useFinancialData(data: FinancialData) {
  return useMemo(() => {
    try {
      // Validar e sanitizar dados de contas a receber
      const safeAccountsReceivable =
        data.accountsReceivable?.accountsReceivable?.map((account) => ({
          ...account,
          clientName: account.clientName || "Cliente não informado",
          amount: Number(account.amount) || 0,
          received: Number(account.received) || 0,
          pending: Number(account.pending) || 0,
          isOverdue: Boolean(account.isOverdue),
        })) || [];

      // Validar e sanitizar dados do resumo financeiro
      const safeFinancialSummary = data.financialSummary
        ? {
            sales: {
              total: Number(data.financialSummary.sales?.total) || 0,
              count: Number(data.financialSummary.sales?.count) || 0,
            },
            receipts: {
              total: Number(data.financialSummary.receipts?.total) || 0,
            },
            payments: {
              total: Number(data.financialSummary.payments?.total) || 0,
            },
            pendingReceivables: {
              total:
                Number(data.financialSummary.pendingReceivables?.total) || 0,
            },
            pendingPayables: {
              total: Number(data.financialSummary.pendingPayables?.total) || 0,
            },
          }
        : undefined;

      return {
        accountsReceivable: {
          accountsReceivable: safeAccountsReceivable,
        },
        financialSummary: safeFinancialSummary,
        hasData: safeAccountsReceivable.length > 0 || !!safeFinancialSummary,
      };
    } catch (error) {
      console.error("Erro ao processar dados financeiros:", error);
      return {
        accountsReceivable: { accountsReceivable: [] },
        financialSummary: undefined,
        hasData: false,
      };
    }
  }, [data]);
}
