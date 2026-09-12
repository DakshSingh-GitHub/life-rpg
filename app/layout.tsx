import type { Metadata } from "next";
import { DynaPuff, Nunito } from "next/font/google";
import "./globals.css";

const dynaPuff = DynaPuff({
  variable: "--font-dynapuff",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Life RPG — Turn Your Boring Chores into Legendary Quests",
  description:
    "Level up your real-life stats. Hit the gym for Brawn, finish homework for Brain Power, and unlock sweet rewards along the way.",
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dynaPuff.variable} ${nunito.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#FDF8EE] text-slate-900 font-sans antialiased selection:bg-[#FFD166] selection:text-slate-950 font-semibold">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


