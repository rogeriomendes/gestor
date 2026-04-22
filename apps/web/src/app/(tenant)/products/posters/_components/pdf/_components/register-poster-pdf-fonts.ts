import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPosterPdfFonts() {
  if (registered) {
    return;
  }

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

  registered = true;
}
