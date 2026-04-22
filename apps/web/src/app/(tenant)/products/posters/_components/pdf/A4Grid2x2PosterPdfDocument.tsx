import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
import type { PosterProduct } from "../types";
import { PosterPdfCard } from "./_components/PosterPdfCard";
import { registerPosterPdfFonts } from "./_components/register-poster-pdf-fonts";

registerPosterPdfFonts();

interface A4Grid2x2PosterPdfDocumentProps {
  products: PosterProduct[];
}

export function A4Grid2x2PosterPdfDocument({
  products,
}: A4Grid2x2PosterPdfDocumentProps) {
  const size = "a4-grid-2x2" as const;
  const pages = Array.from({ length: Math.ceil(products.length / 4) }, (_, i) =>
    products.slice(i * 4, (i + 1) * 4)
  );

  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#FFFFFF",
      flexDirection: "column",
      padding: 0,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      height: "100%",
      width: "100%",
    },
    cell: {
      borderColor: "#D4D4D8",
      borderStyle: "dashed",
      borderWidth: 1,
      height: "50%",
      width: "50%",
    },
  });

  return (
    <Document>
      {pages.map((chunk, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          <View style={styles.grid}>
            {chunk.map((product) => (
              <View
                key={product.internalId || product.id}
                style={styles.cell}
                wrap={false}
              >
                <PosterPdfCard product={product} size={size} />
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
