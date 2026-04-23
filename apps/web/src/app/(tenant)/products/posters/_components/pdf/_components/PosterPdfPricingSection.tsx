import { StyleSheet, View } from "@react-pdf/renderer";
import { PosterPdfPriceBlock } from "./PosterPdfPriceBlock";
import { PosterPdfPromotionMeta } from "./PosterPdfPromotionMeta";
import type { PdfPosterFormat } from "./poster-pdf-presets";

interface PosterPdfPricingSectionProps {
  cents: string;
  compoundUnitPrice: number | null;
  hasPromo: boolean;
  int: string;
  isPack: boolean;
  isWholesale: boolean;
  originalCents: string;
  originalInt: string;
  originalPrice: number;
  qtdPagar?: number;
  qtdPromocao?: number;
  showCompoundUnitInfo: boolean;
  showOriginal: boolean;
  size: PdfPosterFormat;
  unit: string;
}

export function PosterPdfPricingSection({
  cents,
  compoundUnitPrice,
  hasPromo,
  int,
  isPack,
  isWholesale,
  originalCents,
  originalInt,
  originalPrice,
  qtdPagar,
  qtdPromocao,
  showCompoundUnitInfo,
  showOriginal,
  size,
  unit,
}: PosterPdfPricingSectionProps) {
  const styles = StyleSheet.create({
    wrapper: {
      marginTop: 50,
      width: "100%",
    },
  });

  return (
    <View style={styles.wrapper}>
      <PosterPdfPromotionMeta
        hasPromo={hasPromo}
        isPack={isPack}
        isWholesale={isWholesale}
        originalCents={originalCents}
        originalInt={originalInt}
        originalPrice={originalPrice}
        qtdPagar={qtdPagar}
        qtdPromocao={qtdPromocao}
        showOriginal={showOriginal}
        size={size}
        unit={unit}
      />

      <PosterPdfPriceBlock
        cents={cents}
        compoundUnitPrice={compoundUnitPrice}
        int={int}
        isPack={isPack}
        qtdPromocao={qtdPromocao}
        showCompoundUnitInfo={showCompoundUnitInfo}
        size={size}
        unit={unit}
      />
    </View>
  );
}
