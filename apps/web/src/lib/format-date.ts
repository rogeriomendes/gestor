import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

export function formatDate(date: Date, hasDatePicker?: boolean) {
  // Checks if the Date Picker
  if (hasDatePicker) {
    return format(toZonedTime(date, "UTC"), "dd/MM/y", { locale: ptBR }); // Format with date
  }

  // Checks if the time is zeroed
  const hasTime = format(toZonedTime(date, "UTC"), "HH:mm:ss") === "00:00:00";

  // Formats according to the time
  if (hasTime) {
    return format(toZonedTime(date, "UTC"), "dd/MM/y", { locale: ptBR }); // Format with date
  }
  return format(toZonedTime(date, "UTC"), "dd/MM/y HH:mm:ss", {
    locale: ptBR,
  }); // Format with date and time
}
