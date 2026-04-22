import type { PosterProduct } from "../../types";

export function formatPriceParts(value: number) {
  const [int, cents] = Number(value).toFixed(2).split(".");
  return { int, cents };
}

export function getPromotionFlags(product: PosterProduct) {
  const hasPromo = product.qtdPromocao != null && product.qtdPromocao > 0;
  const isPack =
    hasPromo &&
    product.qtdPagar != null &&
    product.qtdPagar > 0 &&
    product.qtdPagar !== product.qtdPromocao;
  const isWholesale =
    hasPromo &&
    (!product.qtdPagar ||
      product.qtdPagar === product.qtdPromocao ||
      product.qtdPagar === 0);

  return { hasPromo, isPack, isWholesale };
}

export function formatProductNameLines(
  rawName: string,
  maxLines = 3,
  maxCharsPerLine = 14
) {
  const words = rawName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word);
      currentLine = "";
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  const hasOverflow =
    lines.length > maxLines || words.join(" ").length > lines.join(" ").length;
  const sliced = lines.slice(0, maxLines);

  if (hasOverflow && sliced.length > 0) {
    const last = sliced.at(-1) ?? "";
    sliced[sliced.length - 1] = `${last.replace(/\.*$/, "")}...`;
  }

  return sliced.join("\n");
}
