import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import type { PosterProduct } from "../types";
import { PosterPdfCard } from "./_components/PosterPdfCard";
import { registerPosterPdfFonts } from "./_components/register-poster-pdf-fonts";

registerPosterPdfFonts();

interface A3FullPosterPdfDocumentProps {
  products: PosterProduct[];
}

export function A3FullPosterPdfDocument({
  products,
}: A3FullPosterPdfDocumentProps) {
  const size = "a3-full" as const;
  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#FFFFFF",
      flexDirection: "column",
    },
  });

  return (
    <Document>
      {products.map((product) => (
        <Page
          key={product.internalId || product.id}
          size="A3"
          style={styles.page}
        >
          <PosterPdfCard product={product} size={size} />
        </Page>
      ))}
    </Document>
  );
}
