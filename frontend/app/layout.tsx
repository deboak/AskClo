import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "AskClo | Your AI stylist",
  description: "Personal AI styling for every wardrobe, from aso-oke to streetwear.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
