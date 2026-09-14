import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { BookingProvider } from "@/lib/booking";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBar } from "@/components/layout/MobileBar";
import { MobileSearchSheet } from "@/components/booking/MobileSearchSheet";
import { QuickView } from "@/components/booking/QuickView";
import { PreviewGate } from "@/components/PreviewGate";
import { site } from "@/content/site";
import { asset } from "@/lib/basePath";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Stand-in for the licensed MADE Mirage on the live site: a high-contrast
// display serif, only ever used large.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const title = "Girls Getaways | Boutique Girls’ Weekends & Hens Getaways in Australia";
const description =
  "Effortless getaways with your best girls. Over one hundred boutique packages across Australia for birthdays, hens or just quality girl time — we book every inclusion and offer individual payments.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: "%s | Girls Getaways" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: site.name,
    url: site.url,
    title,
    description,
    images: [{ url: asset("/img/og.jpg"), width: 1200, height: 630 }],
  },
  icons: {
    icon: [{ url: asset("/img/icon-32.png"), sizes: "32x32" }, { url: asset("/img/icon-192.png"), sizes: "192x192" }],
    apple: asset("/img/icon-180.png"),
  },
};

export const viewport: Viewport = { themeColor: "#fffdfc" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <BookingProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <MobileBar />
          <MobileSearchSheet />
          <QuickView />
          <PreviewGate site="preview-gate-test" staffPath="/staff-60f08c" clientName="Girls Getaways" />
        </BookingProvider>
      </body>
    </html>
  );
}
