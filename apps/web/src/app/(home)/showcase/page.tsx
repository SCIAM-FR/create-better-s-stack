export const dynamic = "force-static";

import { api } from "@better-s-stack/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";

import { ShowcasePage } from "./_components/showcase-page";

export const metadata: Metadata = {
  title: "Showcase - Better-S-Stack",
  description: "Projects created with Better-S-Stack",
  openGraph: {
    title: "Showcase - Better-S-Stack",
    description: "Projects created with Better-S-Stack",
    url: "https://better-s-stack.sciam.fr/showcase",
    images: [
      {
        url: "https://r2.better-t-stack.dev/og.png",
        width: 1200,
        height: 630,
        alt: "Better-S-Stack Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Showcase - Better-S-Stack",
    description: "Projects created with Better-S-Stack",
    images: ["https://r2.better-t-stack.dev/og.png"],
  },
};

export default async function Showcase() {
  const showcaseProjects = await fetchQuery(api.showcase.getShowcaseProjects);
  return <ShowcasePage showcaseProjects={showcaseProjects} />;
}
