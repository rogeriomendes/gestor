import { StyleSheet, View } from "@react-pdf/renderer";
import { PosterPdfPriceBlock } from "./PosterPdfPriceBlock";
import { PosterPdfPromotionMeta } from "./PosterPdfPromotionMeta";
import type { PdfPosterFormat } from "./poster-pdf-presets";

interface PosterPdfPricingSectionProps {
  cents: string;
  hasPromo: boolean;
  int: string;
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

export function PosterPdfPricingSection({
  cents,
  hasPromo,
  int,
  isPack,
  isWholesale,
  originalCents,
  originalInt,
  originalPrice,
  qtdPagar,
  qtdPromocao,
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
        int={int}
        isPack={isPack}
        qtdPromocao={qtdPromocao}
        size={size}
        unit={unit}
      />
    </View>
  );
}
