import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Block & Mortar — Local Perks for Apartment Communities",
  description:
    "Apartment websites show neighborhood deals to prospective renters. Local businesses reach people about to move in. Everyone wins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}
