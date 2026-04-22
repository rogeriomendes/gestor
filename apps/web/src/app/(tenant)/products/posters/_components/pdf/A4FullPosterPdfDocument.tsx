import { theme } from "@/lib/pdfx-theme";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PosterProduct } from "../types";

let oswaldRegistered = false;

if (!oswaldRegistered) {
  // Prevent word hyphenation/splitting: wrap only at spaces.
  Font.registerHyphenationCallback((word) => [word]);

  Font.register({
    family: "Oswald",
    fonts: [
      {
        src: "/fonts/oswald/Oswald-Regular.ttf",
        fontStyle: "normal",
        fontWeight: 400,
      },
      {
        src: "/fonts/oswald/Oswald-Bold.ttf",
        fontStyle: "normal",
        fontWeight: 700,
      },
    ],
  });

  oswaldRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#E63946",
    height: "18%",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "Oswald",
    fontSize: 90,
    fontWeight: 400,
    letterSpacing: 1,
  },
  body: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  productNameWrap: {
    alignItems: "center",
    flex: 0,
    justifyContent: "center",
    minHeight: 210,
    paddingHorizontal: 8,
  },
  productName: {
    color: "#18181B",
    fontFamily: "Oswald",
    fontSize: 70,
    fontWeight: 400,
    lineHeight: 1.05,
    textAlign: "center",
    textTransform: "uppercase",
  },
  originalWrap: {
    marginBottom: 12,
  },
  promoMetaRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    width: "100%",
  },
  promoOriginalBlock: {
    flexDirection: "column",
    maxWidth: "58%",
  },
  promoOriginalLabel: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  promoOriginalPriceRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  promoOriginalCurrency: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 24,
    fontWeight: 700,
    marginRight: 4,
    marginTop: 6,
  },
  promoOriginalInteger: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 70,
    fontWeight: 700,
    letterSpacing: -4,
    lineHeight: 0.9,
  },
  promoOriginalDecimalWrap: {
    alignItems: "flex-start",
    marginLeft: 4,
    marginTop: 8,
  },
  promoOriginalDecimal: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 34,
    fontWeight: 700,
    textDecoration: "underline",
  },
  promoOriginalUnit: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 18,
    fontWeight: 700,
    marginTop: 2,
  },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderColor: "#FFFFFF",
    borderWidth: 3,
    minWidth: 135,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  badgePack: {
    borderRadius: 50,
    backgroundColor: "#2563EB",
  },
  badgeWholesale: {
    borderRadius: 10,
    backgroundColor: "#16A34A",
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: "Oswald",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.05,
    textAlign: "center",
    textTransform: "uppercase",
  },
  finalPriceRowPromoPack: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    marginTop: 2,
    width: "100%",
  },
  promoHelperText: {
    color: "#27272A",
    fontFamily: "Oswald",
    fontSize: 23,
    fontWeight: 700,
    lineHeight: 1.15,
    maxWidth: "34%",
    textAlign: "left",
  },
  originalLabel: {
    color: "#B91C1C",
    fontFamily: "Oswald",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  originalPrice: {
    color: "#B91C1C",
    fontFamily: "Oswald",
    fontSize: 30,
    fontWeight: 700,
    textDecoration: "line-through",
  },
  finalPriceWrap: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 22,
    marginTop: 2,
  },
  finalPriceMain: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "center",
  },
  currency: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 34,
    fontWeight: 700,
    marginRight: 6,
    marginTop: 60,
  },
  integer: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 190,
    fontWeight: 700,
    letterSpacing: -6,
    lineHeight: 0.95,
  },
  decimalWrap: {
    alignItems: "center",
    marginLeft: 4,
    marginTop: 42,
  },
  decimal: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 76,
    fontWeight: 700,
    textDecoration: "underline",
  },
  unit: {
    color: "#18181B",
    fontFamily: "Oswald",
    fontSize: 30,
    fontWeight: 700,
    marginTop: -2,
  },
  footerInfo: {
    alignItems: "center",
    borderTopColor: "#E4E4E7",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    minHeight: 16,
    paddingTop: 4,
  },
  footerText: {
    color: theme.colors.mutedForeground,
    fontSize: 10,
  },
});

function formatPriceParts(value: number) {
  const [int, cents] = Number(value).toFixed(2).split(".");
  return { int, cents };
}

function formatProductNameMaxThreeLines(
  rawName: string,
  maxLines = 3,
  maxCharsPerLine = 14
) {
  const words = rawName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word);
      currentLine = "";
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  const hasOverflow =
    lines.length > maxLines || words.join(" ").length > lines.join(" ").length;

  const sliced = lines.slice(0, maxLines);

  if (hasOverflow && sliced.length > 0) {
    const last = sliced.at(-1) ?? "";
    sliced[sliced.length - 1] = `${last.replace(/\.*$/, "")}...`;
  }

  return sliced.join("\n");
}

interface A4FullPosterPdfDocumentProps {
  products: PosterProduct[];
}

export function A4FullPosterPdfDocument({
  products,
}: A4FullPosterPdfDocumentProps) {
  return (
    <Document>
      {products.map((product) => {
        const { int, cents } = formatPriceParts(product.price);
        const { int: originalInt, cents: originalCents } = formatPriceParts(
          product.originalPrice
        );
        const hasPromo = product.qtdPromocao != null && product.qtdPromocao > 0;
        const isPack =
          hasPromo &&
          product.qtdPagar != null &&
          product.qtdPagar > 0 &&
          product.qtdPagar !== product.qtdPromocao;
        const isWholesale =
          hasPromo &&
          (!product.qtdPagar ||
            product.qtdPagar === product.qtdPromocao ||
            product.qtdPagar === 0);
        const showOriginal =
          product.showOriginalPrice && product.originalPrice > 0;
        const productName = formatProductNameMaxThreeLines(product.name);

        return (
          <Page
            key={product.internalId || product.id}
            size="A4"
            style={styles.page}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>PROMOÇÃO</Text>
            </View>

            <View style={styles.body}>
              <View style={styles.productNameWrap}>
                <Text style={styles.productName}>{productName}</Text>
              </View>

              {hasPromo ? (
                <View style={styles.promoMetaRow}>
                  <View style={styles.promoOriginalBlock}>
                    <Text style={styles.promoOriginalLabel}>
                      Comprando 1 unidade:
                    </Text>
                    <View style={styles.promoOriginalPriceRow}>
                      <Text style={styles.promoOriginalCurrency}>R$</Text>
                      <Text style={styles.promoOriginalInteger}>
                        {originalInt}
                      </Text>
                      <View style={styles.promoOriginalDecimalWrap}>
                        <Text style={styles.promoOriginalDecimal}>
                          ,{originalCents}
                        </Text>
                        <Text style={styles.promoOriginalUnit}>
                          {product.unit}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isPack && (
                    <View style={[styles.badgeWrap, styles.badgePack]}>
                      <Text style={styles.badgeText}>
                        LEVE {product.qtdPromocao}
                      </Text>
                      <Text style={styles.badgeText}>
                        PAGUE {product.qtdPagar}
                      </Text>
                    </View>
                  )}

                  {isWholesale && (
                    <View style={[styles.badgeWrap, styles.badgeWholesale]}>
                      <Text style={styles.badgeText}>A PARTIR DE</Text>
                      <Text style={styles.badgeText}>
                        {product.qtdPromocao} UN
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                showOriginal && (
                  <View style={styles.originalWrap}>
                    <Text style={styles.originalLabel}>DE</Text>
                    <Text style={styles.originalPrice}>
                      R$ {Number(product.originalPrice).toFixed(2)}{" "}
                      {product.unit}
                    </Text>
                  </View>
                )
              )}

              <View
                style={
                  isPack ? styles.finalPriceRowPromoPack : styles.finalPriceWrap
                }
              >
                {isPack && (
                  <Text style={styles.promoHelperText}>
                    Comprando{"\n"}
                    {product.qtdPromocao} unidades,{"\n"}
                    cada 1 sai por:
                  </Text>
                )}
                <View style={styles.finalPriceMain}>
                  <Text style={styles.currency}>R$</Text>
                  <Text style={styles.integer}>{int}</Text>
                  <View style={styles.decimalWrap}>
                    <Text style={styles.decimal}>,{cents}</Text>
                    <Text style={styles.unit}>{product.unit}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.footerInfo}>
                {/* <Text style={styles.footerText}>
                  Cód.: {product.code || product.id}
                </Text> */}
                {product.ean && (
                  <Text style={styles.footerText}>EAN: {product.ean}</Text>
                )}
                {/* <Text style={styles.footerText}>EAN: {product.ean || "-"}</Text> */}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
