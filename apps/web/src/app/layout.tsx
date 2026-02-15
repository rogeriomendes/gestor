import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import Providers from "@/components/providers";
import "../index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | GestorWeb - Sistema ERP",
    default: "GestorWeb - Sistema ERP",
  },
  description: "GestorWeb - Sistema ERP de automação comercial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NextTopLoader
            color="hsl(142.1 76.2% 36.3%)"
            crawl={true}
            crawlSpeed={200}
            easing="ease"
            height={2}
            initialPosition={0.08}
            shadow="0 0 10px hsl(142.1 76.2% 36.3%), 0 0 5px hsl(142.1 76.2% 36.3%)"
            showSpinner={false}
            speed={200}
          />
          <NuqsAdapter>{children}</NuqsAdapter>
        </Providers>
      </body>
    </html>
  );
}
