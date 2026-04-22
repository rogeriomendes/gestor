import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { PosterPdfBadge } from "./PosterPdfBadge";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";

interface PosterPdfPromotionMetaProps {
  hasPromo: boolean;
  isPack: boolean;
  isWholesale: boolean;
  originalCents: string;
  originalInt: string;
  originalPrice: number;
  qtdPagar?: number;
  qtdPromocao?: number;
  showOriginal: boolean;
  size: PdfPosterFormat;
  unit: string;
}

export function PosterPdfPromotionMeta({
  size,
  hasPromo,
  isPack,
  isWholesale,
  originalInt,
  originalCents,
  unit,
  qtdPromocao,
  qtdPagar,
  showOriginal,
  originalPrice,
}: PosterPdfPromotionMetaProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    promoMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
      width: "100%",
    },
    promoOriginalBlock: {
      flexDirection: "column",
      maxWidth: "50%",
    },
    promoOriginalLabel: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: preset.promoOriginalLabelFontSize,
      fontWeight: 700,
      marginBottom: 2,
    },
    promoOriginalPriceRow: {
      alignItems: "flex-start",
      flexDirection: "row",
    },
    promoOriginalCurrency: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: Math.max(
        14,
        Math.floor(preset.promoOriginalLabelFontSize * 1.34)
      ),
      fontWeight: 700,
      marginRight: 4,
      marginTop: 6,
    },
    promoOriginalInteger: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: preset.promoOriginalIntegerFontSize,
      fontWeight: 700,
      letterSpacing: -4,
      lineHeight: 0.9,
    },
    promoOriginalDecimalWrap: {
      alignItems: "flex-start",
      marginLeft: 4,
      marginTop: 8,
    },
    promoOriginalDecimal: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: preset.promoOriginalDecimalFontSize,
      fontWeight: 700,
      textDecoration: "underline",
    },
    promoOriginalUnit: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: preset.promoOriginalUnitFontSize,
      fontWeight: 700,
      marginTop: 2,
    },
    originalWrap: {
      marginBottom: 12,
    },
    originalLabel: {
      color: "#B91C1C",
      fontFamily: "Oswald",
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 4,
    },
    originalPrice: {
      color: "#B91C1C",
      fontFamily: "Oswald",
      fontSize: 30,
      fontWeight: 700,
      textDecoration: "line-through",
    },
  });

  if (hasPromo) {
    return (
      <View style={styles.promoMetaRow}>
        <View style={styles.promoOriginalBlock}>
          <Text style={styles.promoOriginalLabel}>Comprando 1 unidade:</Text>
          <View style={styles.promoOriginalPriceRow}>
            <Text style={styles.promoOriginalCurrency}>R$</Text>
            <Text style={styles.promoOriginalInteger}>{originalInt}</Text>
            <View style={styles.promoOriginalDecimalWrap}>
              <Text style={styles.promoOriginalDecimal}>,{originalCents}</Text>
              <Text style={styles.promoOriginalUnit}>{unit}</Text>
            </View>
          </View>
        </View>

        {isPack ? (
          <PosterPdfBadge
            lines={[`LEVE ${qtdPromocao}`, `PAGUE ${qtdPagar}`]}
            size={size}
            variant="pack"
          />
        ) : null}

        {isWholesale ? (
          <PosterPdfBadge
            lines={["A PARTIR DE", `${qtdPromocao} UN`]}
            size={size}
            variant="wholesale"
          />
        ) : null}
      </View>
    );
  }

  if (showOriginal) {
    return (
      <View style={styles.originalWrap}>
        <Text style={styles.originalLabel}>DE</Text>
        <Text style={styles.originalPrice}>
          R$ {Number(originalPrice).toFixed(2)} {unit}
        </Text>
      </View>
    );
  }

  return null;
}
