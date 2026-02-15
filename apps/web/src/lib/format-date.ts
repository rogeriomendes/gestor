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
