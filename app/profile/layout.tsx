import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hero Profile & Character Sheet",
  description:
    "Review your RPG class, level history, attributes (Brawn, Intellect, Swiftness, Vitality), and achievements in LifeRPG.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
