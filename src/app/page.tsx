import { CTASection } from "@/components/marketing";
import { FeaturedProjectsSection } from "@/components/sections/featured-projects-section";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesSection } from "@/components/sections/services-section";
import { WhyChooseSection } from "@/components/sections/why-choose-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <WhyChooseSection />
      <FeaturedProjectsSection />

      <CTASection
        title="Turn your website into a system that drives growth."
        description="Let’s build a faster website, stronger local visibility, and smarter automation around your business."
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}