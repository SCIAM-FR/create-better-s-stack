export const dynamic = "force-static";

import CommandSection from "./_components/command-section";
import Footer from "./_components/footer";
import HeroSection from "./_components/hero-section";
import SciamSection from "./_components/sciam-section";

export default function HomePage() {
  return (
    <main className="container mx-auto min-h-svh">
      <div className="mx-auto flex flex-col gap-8 px-4 pt-12">
        <HeroSection />
        <CommandSection />
        <SciamSection />
      </div>
      <Footer />
    </main>
  );
}
