import {
    Accessibility,
    Gauge,
    LayoutTemplate,
    Search,
    ShieldCheck,
    Smartphone,
  } from "lucide-react";
  
  import type { BenefitItem } from "@/components/marketing";
  
  export const websiteBenefits = {
    eyebrow: "Website Development",
    title: "Websites built to perform, convert, and grow.",
    description:
      "We combine thoughtful design, modern development, technical SEO, accessibility, and scalable architecture to create websites that support real business growth.",
    items: [
      {
        title: "High Performance",
        description:
          "Fast-loading pages, optimized assets, and efficient code create a smoother experience for customers and search engines.",
        icon: Gauge,
      },
      {
        title: "Conversion-Focused UX",
        description:
          "Clear messaging, intuitive navigation, and strong calls to action help turn more visitors into leads and customers.",
        icon: LayoutTemplate,
      },
      {
        title: "Technical SEO",
        description:
          "Clean structure, metadata, semantic HTML, internal linking, and performance best practices give your site a stronger search foundation.",
        icon: Search,
      },
      {
        title: "Mobile-First Design",
        description:
          "Every page is designed to work smoothly across phones, tablets, laptops, and large desktop screens.",
        icon: Smartphone,
      },
      {
        title: "Accessible Experiences",
        description:
          "Thoughtful contrast, keyboard support, semantic structure, and accessible interactions make the site easier for everyone to use.",
        icon: Accessibility,
      },
      {
        title: "Secure and Scalable",
        description:
          "Modern architecture and deployment practices support future integrations, automation, customer portals, and continued growth.",
        icon: ShieldCheck,
      },
    ] satisfies readonly BenefitItem[],
  } as const;