import type { Metadata, Viewport } from "next";
import { DynaPuff, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";

const dynaPuff = DynaPuff({
  variable: "--font-dynapuff",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://liferpg.app";

export const viewport: Viewport = {
  themeColor: "#FDF8EE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LifeRPG — Turn Daily Habits Into An Epic RPG Adventure",
    template: "%s | LifeRPG",
  },
  description:
    "Level up your real-life stats with LifeRPG. Turn chores, fitness routines, and deep work into XP, gold coins, and legendary loot. 100% free gamified productivity engine.",
  applicationName: "LifeRPG",
  authors: [{ name: "LifeRPG Adventurers", url: siteUrl }],
  creator: "LifeRPG",
  publisher: "LifeRPG",
  keywords: [
    "life rpg",
    "habit tracker",
    "gamified productivity",
    "rpg to-do list",
    "habit gamification",
    "daily quests",
    "gamify life",
    "free habit tracker",
    "productivity game",
  ],
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeRPG",
  },
  openGraph: {
    title: "LifeRPG — Turn Daily Habits Into An Epic RPG Adventure",
    description:
      "Transform real-world workouts, study hours, and daily chores into character attributes, streak multipliers, and custom loot rewards.",
    url: siteUrl,
    siteName: "LifeRPG",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LifeRPG — Gamified Habit & Goal Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeRPG — Turn Daily Habits Into An Epic RPG Adventure",
    description:
      "Level up your real-life stats with LifeRPG. 100% free gamified productivity engine.",
    creator: "@liferpg",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  category: "productivity",
  classification: "Gamified Productivity Application",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? {
          "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION],
        }
      : undefined,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "LifeRPG",
      alternateName: ["Life RPG", "LifeRPG App", "LifeRPG Productivity"],
      description:
        "Turn daily habits, fitness, chores, and study into an epic RPG questing adventure with XP, levels, and custom loot rewards.",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-US",
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "LifeRPG",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
      },
      image: `${siteUrl}/og-image.png`,
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "LifeRPG",
      url: siteUrl,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "Turn your daily chores, workouts, and study routines into legendary quests with real-world XP, streak bonuses, and gold rewards.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1280",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "Attribute XP progression (Brawn, Intellect, Swiftness, Vitality)",
        "Multiplayer party quests and accountability guilds",
        "Customizable loot rewards shop",
        "Streak multipliers and daily bounties",
        "Cross-platform real-time sync",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How does LifeRPG differ from standard to-do list applications?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Traditional to-do apps rely on guilt and negative reinforcement when tasks roll over. LifeRPG employs scientifically proven behavioral gamification: every completed action awards attribute XP, virtual currency, and streak multipliers. By turning mundane chores into a tangible RPG progression loop, friction and avoidance are replaced by motivation.",
          },
        },
        {
          "@type": "Question",
          name: "Is LifeRPG really 100% free of cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely! LifeRPG is 100% free of cost for everyone. There are no paid plans, no premium tiers, no hidden subscriptions, no in-app purchases, and no advertisements. Every feature—including unlimited bounties, multiplayer party quests, custom loot rewards, stat progression, and cross-platform cloud sync—is completely unlocked for all adventurers.",
          },
        },
        {
          "@type": "Question",
          name: "Can I customize my own rewards and task values?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. The Custom Loot Shop allows you to define your own real-world self-rewards (such as a favorite coffee, an hour of gaming, or a movie night) and set the exact gold cost required to unlock them guilt-free.",
          },
        },
        {
          "@type": "Question",
          name: "Does LifeRPG support team or family accountability?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Our Party & Guild feature enables you to embark on co-op quests with friends, family, or colleagues. Party members hold each other accountable, battle communal procrastination bosses, and celebrate milestone achievements together.",
          },
        },
        {
          "@type": "Question",
          name: "What platforms is LifeRPG available on?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LifeRPG is accessible across modern web browsers, iOS, Android, and desktop devices with real-time cloud synchronization. Your character progression, bounties, and streak status stay seamlessly updated across all devices.",
          },
        },
      ],
    },
  ],
};

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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href="/favicon-48x48.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-TileColor" content="#FF6B8B" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-[#FDF8EE] text-slate-900 font-sans antialiased selection:bg-[#FFD166] selection:text-slate-950 font-semibold">
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}


