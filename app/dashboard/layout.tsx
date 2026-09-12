import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hero Dashboard",
  description:
    "Track your daily habits, active bounties, gold pouch, streak multipliers, and attribute progression in LifeRPG.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
