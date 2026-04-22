import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";

interface PosterPdfHeaderProps {
  size: PdfPosterFormat;
  title: string;
}

export function PosterPdfHeader({ size, title }: PosterPdfHeaderProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    header: {
      alignItems: "center",
      backgroundColor: "#E63946",
      height: "18%",
      justifyContent: "center",
    },
    title: {
      color: "#FFFFFF",
      fontFamily: "Oswald",
      fontSize: preset.headerTitleFontSize,
      fontWeight: 400,
      letterSpacing: preset.headerTitleLetterSpacing,
    },
  });

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
