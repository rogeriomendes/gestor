import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";

type BadgeVariant = "pack" | "wholesale";

interface PosterPdfBadgeProps {
  lines: [string, string];
  size: PdfPosterFormat;
  variant: BadgeVariant;
}

export function PosterPdfBadge({ lines, size, variant }: PosterPdfBadgeProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    wrap: {
      alignItems: "center",
      borderColor: "#FFFFFF",
      borderWidth: 3,
      justifyContent: "center",
      minWidth: preset.badgeMinWidth,
      paddingBottom: 16,
      paddingHorizontal: 12,
      paddingTop: 6,
    },
    pack: {
      backgroundColor: "#2563EB",
      borderRadius: 50,
    },
    wholesale: {
      backgroundColor: "#16A34A",
      borderRadius: 10,
    },
    text: {
      color: "#FFFFFF",
      fontFamily: "Oswald",
      fontSize: preset.badgeFontSize,
      fontWeight: 700,
      lineHeight: 1.05,
      textAlign: "center",
      textTransform: "uppercase",
    },
  });

  return (
    <View
      style={[styles.wrap, variant === "pack" ? styles.pack : styles.wholesale]}
    >
      <Text style={styles.text}>{lines[0]}</Text>
      <Text style={styles.text}>{lines[1]}</Text>
    </View>
  );
}
