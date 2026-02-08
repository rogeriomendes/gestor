import { isBefore, isSameDay, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export type StatusInfo = {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  color?: string;
};

// Vendas e recibos (NFCe): usa devolução/cancelado e STATUS_NOTA (5,7,9)
export function getNfceStatusInfo(params: {
  devolucao?: string | null;
  canceladoIdUsuario?: number | null;
  nfeStatus?: string | null;
}): StatusInfo {
  const { devolucao, canceladoIdUsuario, nfeStatus } = params;

  if (devolucao === "S" || !!canceladoIdUsuario) {
    return {
      label: "Cancelada",
      variant: "secondary",
      color: "bg-red-500/15 text-red-600 dark:text-red-400",
    };
  }
  if (devolucao === "S") {
    return {
      label: "Devolução",
      variant: "secondary",
      color: "bg-red-500/15 text-red-600 dark:text-red-400",
    };
  }

  switch (nfeStatus) {
    case "5":
      return { label: "Enviado", variant: "secondary" };
    case "7":
      return {
        label: "Contingência",
        variant: "secondary",
        color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
      };
    case "9":
      return {
        label: "Aguardando aut.",
        variant: "secondary",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
    default:
      return {
        label: "Não enviada",
        variant: "secondary",
        color: "bg-red-500/15 text-red-600 dark:text-red-400",
      };
  }
}

// Orçamentos (SITUACAO: F, D, C)
export function getBudgetSituationInfo(situacao?: string | null): StatusInfo {
  switch (situacao) {
    case "F":
      return { label: "Faturado", variant: "secondary" };
    case "D":
      return {
        label: "Digitação",
        variant: "secondary",
        color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
      };
    case "C":
      return {
        label: "Cancelado",
        variant: "secondary",
        color: "bg-red-500/15 text-red-600 dark:text-red-400",
      };
    default:
      return {
        label: "Desconhecido",
        variant: "outline",
        color: "text-muted-foreground",
      };
  }
}

// Contas a pagar: atrasada / vencendo hoje / a vencer
export function getPayStatusInfo(vencimento: Date): StatusInfo {
  // Normalizar datas para comparação (início do dia em UTC)
  const vencimentoUTC = startOfDay(toZonedTime(vencimento, "UTC"));
  const hoje = startOfDay(toZonedTime(new Date(), "UTC"));

  if (isBefore(vencimentoUTC, hoje)) {
    return {
      label: "Atrasado",
      variant: "secondary",
      color: "bg-red-500/15 text-red-600 dark:text-red-400",
    };
  }

  if (isSameDay(vencimentoUTC, hoje)) {
    return {
      label: "Vencendo hoje",
      variant: "secondary",
      color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    };
  }

  return { label: "A vencer", variant: "secondary" };
}

// Contas a pagar usando SITUACAO
export function getPayStatusBySituation(situacao?: string | null): StatusInfo {
  switch (situacao) {
    case "2":
      return { label: "Quitado", variant: "secondary" };
    case "1":
      return { label: "Em aberto", variant: "secondary" };
    case "3":
      return {
        label: "Parcial",
        variant: "secondary",
        color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
      };
    case "4":
      return {
        label: "Renegociado",
        variant: "secondary",
        color: "bg-red-500/15 text-red-600 dark:text-red-400",
      };
    default:
      return {
        label: "Desconhecido",
        variant: "outline",
        color: "text-muted-foreground",
      };
  }
}

// Contas a receber (lançamento receber): quitado / parcial / em aberto
export function getReceiveStatusById(statusId?: number | null): StatusInfo {
  switch (statusId) {
    case 1:
      return { label: "Em aberto", variant: "secondary" };
    case 2:
      return { label: "Quitado", variant: "secondary" };
    case 3:
      return {
        label: "Parcial",
        variant: "secondary",
        color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
      };
    case 4:
      return {
        label: "Renegociado",
        variant: "secondary",
        color: "bg-red-500/15 text-red-600 dark:text-red-400",
      };
    default:
      return {
        label: "Desconhecido",
        variant: "outline",
        color: "text-muted-foreground",
      };
  }
}

// Promoções (productsSale): execução / concluído
export function getSaleStatusInfo(status?: string | null): StatusInfo {
  switch (status) {
    case "E":
      return {
        label: "Execução",
        variant: "secondary",
        color: "bg-green-500/15 text-green-600 dark:text-green-400",
      };
    case "C":
      return { label: "Concluído", variant: "secondary" };
    case "A":
      return {
        label: "Aguardando",
        variant: "secondary",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
    default:
      return { label: "Desconhecido", variant: "outline" };
  }
}

// Fechamento financeiro: aberto / fechado
export function getFinancialClosingStatusInfo(
  type: "open" | "closed"
): StatusInfo {
  switch (type) {
    case "open":
      return {
        label: "Aberto",
        variant: "secondary",
        color: "bg-green-500/15 text-green-600 dark:text-green-400",
      };
    case "closed":
      return { label: "Fechado", variant: "secondary" };
    default:
      return { label: "Desconhecido", variant: "outline" };
  }
}

// DFE (Documento Fiscal Eletrônico): XML disponível / indisponível
export function getXmlStatusInfo(docXml?: any): StatusInfo {
  const hasXml =
    docXml &&
    (Array.isArray(docXml) ? docXml.length > 0 : true) &&
    docXml !== null &&
    docXml !== undefined;

  if (hasXml) {
    return { label: "Disponível", variant: "secondary" };
  }

  return {
    label: "Indisponível",
    variant: "secondary",
    color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  };
}
