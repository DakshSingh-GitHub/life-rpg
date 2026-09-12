import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In & Begin Questing",
  description:
    "Log in to LifeRPG or create your free adventurer account to level up your real-life stats and unlock rewards.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
