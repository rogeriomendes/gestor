import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAsPercentage(num: number, limit?: boolean) {
  if (limit && num > 999.99) {
    return "+999%";
  }
  const formattedNum = new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num / 100);
  return formattedNum;
}

export function formatAsCurrency(num: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}
export function formatAsNumber(num: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculePercentageBetweenValues(
  num: number,
  num2: number,
  limit?: boolean
) {
  const percentual = ((num2 - num) * 100) / num;
  return formatAsPercentage(percentual, limit);
}

export function calculePercentage(num: number, num2: number) {
  const percentage = (num2 / 100) * num;
  return percentage;
}

export function removeLeadingZero(num: string) {
  if (num.startsWith("0")) {
    return Number.parseInt(num.slice(1), 10);
  }
  return num;
}
