import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

export function formatDate(date: Date | string, hasDatePicker?: boolean) {
  const d = typeof date === "string" ? new Date(date) : date;
  // Checks if the Date Picker
  if (hasDatePicker) {
    return format(toZonedTime(d, "UTC"), "dd/MM/y", { locale: ptBR }); // Format with date
  }

  // Checks if the time is zeroed
  const hasTime = format(toZonedTime(d, "UTC"), "HH:mm:ss") === "00:00:00";

  // Formats according to the time
  if (hasTime) {
    return format(toZonedTime(d, "UTC"), "dd/MM/y", { locale: ptBR }); // Format with date
  }
  return format(toZonedTime(d, "UTC"), "dd/MM/y HH:mm:ss", {
    locale: ptBR,
  }); // Format with date and time
}

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

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
