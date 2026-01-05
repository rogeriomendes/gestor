/**
 * Utilitários centralizados para formatação de datas
 */

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY HH:mm)
 * @param date - A data a ser formatada
 * @returns A data formatada
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata uma data para o formato brasileiro apenas com data (DD/MM/YYYY)
 * @param date - A data a ser formatada
 * @returns A data formatada
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formata uma data para o formato brasileiro apenas com hora (HH:mm)
 * @param date - A data a ser formatada
 * @returns A hora formatada
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata uma data relativa (ex: "há 2 horas", "há 3 dias")
 * @param date - A data a ser formatada
 * @returns A data relativa formatada
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) {
    return "N/A";
  }

  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "agora";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? "mês" : "meses"}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `há ${diffInYears} ${diffInYears === 1 ? "ano" : "anos"}`;
}
