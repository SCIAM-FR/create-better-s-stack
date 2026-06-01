import { api } from "@better-s-stack/backend/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";

import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics - Better-S-Stack",
  description: "Convex-backed project creation analytics for Better-S-Stack.",
  openGraph: {
    title: "Analytics - Better-S-Stack",
    description: "Convex-backed project creation analytics for Better-S-Stack.",
    url: "https://better-s-stack.sciam.fr/analytics",
    images: [
      {
        url: "https://r2.better-t-stack.dev/og.png",
        width: 1200,
        height: 630,
        alt: "Better-S-Stack Convex Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytics - Better-S-Stack",
    description: "Convex-backed project creation analytics for Better-S-Stack.",
    images: ["https://r2.better-t-stack.dev/og.png"],
  },
};

export default async function Analytics() {
  const [preloadedStats, preloadedDailyStats, preloadedMonthlyStats] = await Promise.all([
    preloadQuery(api.analytics.getStats, {}),
    preloadQuery(api.analytics.getDailyStats, { days: 30 }),
    preloadQuery(api.analytics.getMonthlyStats, {}),
  ]);

  return (
    <AnalyticsClient
      preloadedStats={preloadedStats}
      preloadedDailyStats={preloadedDailyStats}
      preloadedMonthlyStats={preloadedMonthlyStats}
    />
  );
}
