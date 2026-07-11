import { CTASection } from "@/components/marketing";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesSection } from "@/components/sections/services-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />

      <CTASection
        title="Turn your website into a system that drives growth."
        description="Let’s build a faster website, stronger local visibility, and smarter automation around your business."
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}