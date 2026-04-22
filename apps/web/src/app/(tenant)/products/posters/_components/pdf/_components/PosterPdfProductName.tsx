import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";

interface PosterPdfProductNameProps {
  name: string;
  size: PdfPosterFormat;
}

export function PosterPdfProductName({
  size,
  name,
}: PosterPdfProductNameProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: preset.productNameMinHeight,
      paddingHorizontal: 8,
    },
    name: {
      color: "#18181B",
      fontFamily: "Oswald",
      fontSize: preset.productNameFontSize,
      fontWeight: 400,
      lineHeight: 1.05,
      textAlign: "center",
      textTransform: "uppercase",
    },
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}
