import { StyleSheet, View } from "@react-pdf/renderer";
import type { PosterProduct } from "../../types";
import { PosterPdfFooter } from "./PosterPdfFooter";
import { PosterPdfHeader } from "./PosterPdfHeader";
import { PosterPdfPricingSection } from "./PosterPdfPricingSection";
import { PosterPdfProductName } from "./PosterPdfProductName";
import { type PdfPosterFormat, POSTER_PDF_PRESETS } from "./poster-pdf-presets";
import {
  formatPriceParts,
  formatProductNameLines,
  getPromotionFlags,
} from "./poster-pdf-utils";

interface PosterPdfCardProps {
  product: PosterProduct;
  size: PdfPosterFormat;
}

export function PosterPdfCard({ product, size }: PosterPdfCardProps) {
  const preset = POSTER_PDF_PRESETS[size];
  const styles = StyleSheet.create({
    body: {
      backgroundColor: "#FFFFFF",
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: preset.bodyPaddingBottom,
      paddingHorizontal: preset.bodyPaddingHorizontal,
      paddingTop: preset.bodyPaddingTop,
    },
  });

  const { int, cents } = formatPriceParts(product.price);
  const { int: originalInt, cents: originalCents } = formatPriceParts(
    product.originalPrice
  );
  const { hasPromo, isPack, isWholesale } = getPromotionFlags(product);
  const showOriginal = !!product.showOriginalPrice && product.originalPrice > 0;
  const compoundUnitPrice =
    product.isCompound && (product.compoundTotalQuantity ?? 0) > 0
      ? product.price / Number(product.compoundTotalQuantity)
      : null;
  const productName = formatProductNameLines(
    product.name,
    3,
    preset.productNameCharsPerLine
  );

  return (
    <>
      <PosterPdfHeader size={size} title="PROMOÇÃO" />
      <View style={styles.body}>
        <PosterPdfProductName name={productName} size={size} />
        <PosterPdfPricingSection
          cents={cents}
          compoundUnitPrice={compoundUnitPrice}
          hasPromo={hasPromo}
          int={int}
          isPack={isPack}
          isWholesale={isWholesale}
          originalCents={originalCents}
          originalInt={originalInt}
          originalPrice={product.originalPrice}
          qtdPagar={product.qtdPagar}
          qtdPromocao={product.qtdPromocao}
          showCompoundUnitInfo={!!product.showCompoundUnitInfo}
          showOriginal={showOriginal}
          size={size}
          unit={product.unit}
        />
        <PosterPdfFooter ean={product.ean} />
      </View>
    </>
  );
}
