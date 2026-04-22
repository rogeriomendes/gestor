import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { theme } from "@/lib/pdfx-theme";

interface PosterPdfFooterProps {
  ean?: string;
}

export function PosterPdfFooter({ ean }: PosterPdfFooterProps) {
  const styles = StyleSheet.create({
    wrap: {
      alignItems: "center",
      borderTopColor: "#E4E4E7",
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 2,
      minHeight: 16,
      paddingTop: 4,
    },
    text: {
      color: theme.colors.mutedForeground,
      fontSize: 10,
    },
  });

  return (
    <View style={styles.wrap}>
      {ean ? <Text style={styles.text}>EAN: {ean}</Text> : null}
    </View>
  );
}
