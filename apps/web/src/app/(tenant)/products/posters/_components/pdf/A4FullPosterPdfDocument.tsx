import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { theme } from "@/lib/pdfx-theme";
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
    paddingBottom: 24,
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  productNameWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
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
    marginTop: 6,
    marginBottom: 75,
  },
  currency: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 40,
    fontWeight: 700,
    marginRight: 8,
    marginTop: 85,
  },
  integer: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 250,
    fontWeight: 700,
    letterSpacing: -6,
    lineHeight: 0.95,
  },
  decimalWrap: {
    alignItems: "center",
    marginLeft: 6,
    marginTop: 60,
  },
  decimal: {
    color: "#D00000",
    fontFamily: "Oswald",
    fontSize: 100,
    fontWeight: 700,
    textDecoration: "underline",
  },
  unit: {
    color: "#18181B",
    fontFamily: "Oswald",
    fontSize: 38,
    fontWeight: 700,
    // marginTop: 8,
  },
  footerInfo: {
    alignItems: "center",
    borderTopColor: "#E4E4E7",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
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

              {showOriginal ? (
                <View style={styles.originalWrap}>
                  <Text style={styles.originalLabel}>DE</Text>
                  <Text style={styles.originalPrice}>
                    R$ {Number(product.originalPrice).toFixed(2)} {product.unit}
                  </Text>
                </View>
              ) : null}

              <View style={styles.finalPriceWrap}>
                <Text style={styles.currency}>R$</Text>
                <Text style={styles.integer}>{int}</Text>
                <View style={styles.decimalWrap}>
                  <Text style={styles.decimal}>,{cents}</Text>
                  <Text style={styles.unit}>{product.unit}</Text>
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
