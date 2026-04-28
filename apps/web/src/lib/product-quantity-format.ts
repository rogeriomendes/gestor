export interface UnitFractionRule {
  PODE_FRACIONAR?: string | null;
  SIGLA?: string | null;
}

export type UnitFractionRulesMap = Record<string, UnitFractionRule>;

/**
 * Exceções de negócio temporárias:
 * estas siglas são tratadas como NÃO fracionáveis,
 * independentemente do `PODE_FRACIONAR` vindo do banco.
 *
 * Para remover esse comportamento no futuro, basta esvaziar/remover este Set.
 */
const FORCE_NON_FRACTION_UNITS = new Set(["UN"]);

/**
 * Formata quantidade de item baseado na regra de fracionamento da unidade.
 * - PODE_FRACIONAR = "S" => 3 casas decimais
 * - caso contrário => inteiro
 */
export function formatProductQuantityByRule(
  qty: string | number,
  unitSigla: string,
  rulesMap?: UnitFractionRulesMap
): string {
  const numericQty = typeof qty === "number" ? qty : Number(qty);
  if (Number.isNaN(numericQty)) {
    return String(qty);
  }

  const normalizedSigla = unitSigla.trim().toUpperCase();
  if (FORCE_NON_FRACTION_UNITS.has(normalizedSigla)) {
    return String(Math.trunc(numericQty));
  }

  const unitRule = rulesMap?.[normalizedSigla];
  const canFraction =
    typeof unitRule?.PODE_FRACIONAR === "string" &&
    unitRule.PODE_FRACIONAR.trim().toUpperCase() === "S";

  if (canFraction) {
    return numericQty.toFixed(3);
  }

  return String(Math.trunc(numericQty));
}
