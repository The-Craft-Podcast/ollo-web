import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import BuyMeCoffeeButton from '@/components/BuyMeCoffeeButton';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Podcast Clip Search",
  description: "Search and play podcast clips",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
        <Footer />
        <GoogleAnalytics gaId="G-3CBRHGJCW4" />
        <BuyMeCoffeeButton />
      </body>
    </html>
  );
}