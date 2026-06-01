import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SciamSection() {
  return (
    <section className="rounded-2xl bg-fd-background/75 p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-bold font-mono text-lg sm:text-xl">ABOUT_SCIAM</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="mb-3 font-mono text-2xl text-foreground sm:text-3xl">
            <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text font-bold text-transparent">
              SCIAM
            </span>
          </p>
          <p className="font-mono text-muted-foreground text-sm leading-relaxed sm:text-base">
            This generator is maintained by SCIAM. We build modern, type-safe software and ship it
            to production — combining strong engineering practices with pragmatic delivery for our
            clients.
          </p>

          <Link
            href="https://sciam.fr"
            target="_blank"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-mono text-foreground text-sm transition-colors hover:bg-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            sciam.fr
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="grid content-center gap-3 font-mono text-muted-foreground text-sm sm:text-base">
          {[
            "End-to-end type safety, by default",
            "TypeScript & Python full-stack scaffolding",
            "Production-ready presets out of the box",
            "Built and maintained by SCIAM engineers",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary">$</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
