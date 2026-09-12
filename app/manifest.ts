import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeRPG — Gamified Habit & Goal Platform",
    short_name: "LifeRPG",
    description:
      "Transform real-world chores, fitness, and deep work into XP, loot, and character progression.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF8EE",
    theme_color: "#FF6B8B",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
