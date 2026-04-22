export type PdfPosterFormat =
  | "a4-full"
  | "a3-full"
  | "a4-grid-2x2"
  | "a4-grid-2x4";

export interface PosterPdfPreset {
  badgeFontSize: number;
  badgeMinWidth: number;
  bodyPaddingBottom: number;
  bodyPaddingHorizontal: number;
  bodyPaddingTop: number;
  headerTitleFontSize: number;
  headerTitleLetterSpacing: number;
  priceCurrencyFontSize: number;
  priceCurrencyMarginTop: number;
  priceDecimalFontSize: number;
  priceDecimalMarginTop: number;
  priceIntegerFontSize: number;
  priceUnitFontSize: number;
  productNameCharsPerLine: number;
  productNameFontSize: number;
  productNameMinHeight: number;
  promoHelperFontSize: number;
  promoOriginalDecimalFontSize: number;
  promoOriginalIntegerFontSize: number;
  promoOriginalLabelFontSize: number;
  promoOriginalUnitFontSize: number;
}

// Presets derived from current HTML poster formats.
export const POSTER_PDF_PRESETS: Record<PdfPosterFormat, PosterPdfPreset> = {
  "a4-full": {
    bodyPaddingBottom: 14,
    bodyPaddingHorizontal: 24,
    bodyPaddingTop: 14,
    productNameCharsPerLine: 14,
    productNameFontSize: 70,
    productNameMinHeight: 210,
    headerTitleFontSize: 90,
    headerTitleLetterSpacing: 1,
    priceCurrencyFontSize: 34,
    priceIntegerFontSize: 190,
    priceDecimalFontSize: 76,
    priceUnitFontSize: 30,
    priceCurrencyMarginTop: 60,
    priceDecimalMarginTop: 42,
    badgeMinWidth: 135,
    badgeFontSize: 20,
    promoHelperFontSize: 23,
    promoOriginalLabelFontSize: 18,
    promoOriginalIntegerFontSize: 70,
    promoOriginalDecimalFontSize: 34,
    promoOriginalUnitFontSize: 18,
  },
  "a3-full": {
    bodyPaddingBottom: 20,
    bodyPaddingHorizontal: 32,
    bodyPaddingTop: 20,
    productNameCharsPerLine: 14,
    productNameFontSize: 98,
    productNameMinHeight: 290,
    headerTitleFontSize: 128,
    headerTitleLetterSpacing: 2,
    priceCurrencyFontSize: 48,
    priceIntegerFontSize: 265,
    priceDecimalFontSize: 106,
    priceUnitFontSize: 42,
    priceCurrencyMarginTop: 78,
    priceDecimalMarginTop: 54,
    badgeMinWidth: 190,
    badgeFontSize: 30,
    promoHelperFontSize: 32,
    promoOriginalLabelFontSize: 26,
    promoOriginalIntegerFontSize: 98,
    promoOriginalDecimalFontSize: 48,
    promoOriginalUnitFontSize: 24,
  },
  "a4-grid-2x2": {
    bodyPaddingBottom: 8,
    bodyPaddingHorizontal: 10,
    bodyPaddingTop: 8,
    productNameCharsPerLine: 13,
    productNameFontSize: 40,
    productNameMinHeight: 90,
    headerTitleFontSize: 54,
    headerTitleLetterSpacing: 1,
    priceCurrencyFontSize: 26,
    priceIntegerFontSize: 130,
    priceDecimalFontSize: 52,
    priceUnitFontSize: 22,
    priceCurrencyMarginTop: 38,
    priceDecimalMarginTop: 30,
    badgeMinWidth: 90,
    badgeFontSize: 16,
    promoHelperFontSize: 14,
    promoOriginalLabelFontSize: 12,
    promoOriginalIntegerFontSize: 40,
    promoOriginalDecimalFontSize: 20,
    promoOriginalUnitFontSize: 12,
  },
  "a4-grid-2x4": {
    bodyPaddingBottom: 4,
    bodyPaddingHorizontal: 6,
    bodyPaddingTop: 4,
    productNameCharsPerLine: 12,
    productNameFontSize: 30,
    productNameMinHeight: 56,
    headerTitleFontSize: 34,
    headerTitleLetterSpacing: 1,
    priceCurrencyFontSize: 12,
    priceIntegerFontSize: 66,
    priceDecimalFontSize: 28,
    priceUnitFontSize: 12,
    priceCurrencyMarginTop: 16,
    priceDecimalMarginTop: 10,
    badgeMinWidth: 72,
    badgeFontSize: 10,
    promoHelperFontSize: 10,
    promoOriginalLabelFontSize: 8,
    promoOriginalIntegerFontSize: 14,
    promoOriginalDecimalFontSize: 10,
    promoOriginalUnitFontSize: 8,
  },
};
