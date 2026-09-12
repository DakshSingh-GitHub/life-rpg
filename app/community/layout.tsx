import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adventurer Guild & Community",
  description:
    "Join multiplayer parties, fight procrastination bosses, and compete on weekly leaderboards with fellow LifeRPG adventurers.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "Adventurer Guild & Community | LifeRPG",
    description:
      "Join multiplayer parties, fight procrastination bosses, and compete on weekly leaderboards with fellow LifeRPG adventurers.",
    url: "/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
