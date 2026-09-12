import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings & Preferences",
  description:
    "Manage your LifeRPG adventurer account, sound effects, theme settings, and privacy options.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
