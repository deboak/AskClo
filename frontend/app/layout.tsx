import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { PreferencesBootstrap } from "@/components/preferences-bootstrap";
import "./globals.css";
import "./fonts.css";
import "./premium.css";

const askCloFont = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-askclo",
});

export const metadata: Metadata = {
  title: "AskClo | Your AI stylist",
  description: "Personal AI styling for every wardrobe, from aso-oke to streetwear.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={askCloFont.variable} suppressHydrationWarning>
      <body className={askCloFont.className} suppressHydrationWarning>
        <PreferencesBootstrap />
        {children}
      </body>
    </html>
  );
}
