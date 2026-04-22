import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";

interface PosterPdfPriceBlockProps {
  cents: string;
  int: string;
  isPack: boolean;
  qtdPromocao?: number;
  size: PdfPosterFormat;
  unit: string;
}

export function PosterPdfPriceBlock({
  size,
  int,
  cents,
  unit,
  isPack,
  qtdPromocao,
}: PosterPdfPriceBlockProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    rowPack: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 22,
      marginTop: 2,
      alignContent: "center",
      width: "100%",
    },
    rowNormal: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 22,
      marginTop: 2,
      width: "100%",
    },
    helper: {
      color: "#27272A",
      fontFamily: "Oswald",
      fontSize: preset.promoHelperFontSize,
      fontWeight: 700,
      lineHeight: 1.15,
      maxWidth: "34%",
      textAlign: "left",
    },
    main: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "center",
    },
    currency: {
      color: "#D00000",
      fontFamily: "Oswald",
      fontSize: preset.priceCurrencyFontSize,
      fontWeight: 700,
      marginRight: 6,
      marginTop: preset.priceCurrencyMarginTop,
    },
    integer: {
      color: "#D00000",
      fontFamily: "Oswald",
      fontSize: preset.priceIntegerFontSize,
      fontWeight: 700,
      letterSpacing: -6,
      lineHeight: 0.95,
    },
    decimalWrap: {
      alignItems: "center",
      marginLeft: 4,
      marginTop: preset.priceDecimalMarginTop,
    },
    decimal: {
      color: "#D00000",
      fontFamily: "Oswald",
      fontSize: preset.priceDecimalFontSize,
      fontWeight: 700,
      textDecoration: "underline",
    },
    unit: {
      color: "#18181B",
      fontFamily: "Oswald",
      fontSize: preset.priceUnitFontSize,
      fontWeight: 700,
      marginTop: -2,
    },
  });

  return (
    <View style={isPack ? styles.rowPack : styles.rowNormal}>
      {isPack ? (
        <Text style={styles.helper}>
          Comprando{"\n"}
          {qtdPromocao} unidades,{"\n"}
          cada 1 sai por:
        </Text>
      ) : null}
      <View style={styles.main}>
        <Text style={styles.currency}>R$</Text>
        <Text style={styles.integer}>{int}</Text>
        <View style={styles.decimalWrap}>
          <Text style={styles.decimal}>,{cents}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
}
