import {
  Accessibility,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  Car,
  ClipboardList,
  Code2,
  Database,
  Gauge,
  HeartPulse,
  House,
  LayoutTemplate,
  Lightbulb,
  Link2,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TestTube2,
  Utensils,
  Workflow,
  Wrench,
} from "lucide-react";

import type {
  BenefitItem,
  CapabilityItem,
  FAQItem,
  IndustryItem,
  ProcessItem,
} from "@/components/marketing";

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

export const websiteProcess = {
  eyebrow: "Our Development Process",
  title: "A clear process from strategy to launch.",
  description:
    "Every website project follows a structured process designed to reduce uncertainty, keep communication clear, and create a stronger final product.",
  items: [
    {
      number: "01",
      title: "Discovery",
      description:
        "We learn about your business, customers, services, goals, competitors, current challenges, and what success should look like.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Strategy & Architecture",
      description:
        "We plan the site structure, customer journeys, page hierarchy, technical requirements, integrations, and conversion paths.",
      icon: Lightbulb,
    },
    {
      number: "03",
      title: "UX & Design",
      description:
        "We create a clear visual direction with thoughtful layouts, responsive behavior, strong messaging, and intuitive navigation.",
      icon: LayoutTemplate,
    },
    {
      number: "04",
      title: "Development",
      description:
        "We build the website using modern, maintainable technology with performance, accessibility, SEO, and scalability in mind.",
      icon: Code2,
    },
    {
      number: "05",
      title: "Testing & Quality Assurance",
      description:
        "We test functionality, forms, responsive layouts, accessibility, browser compatibility, performance, and technical SEO.",
      icon: TestTube2,
    },
    {
      number: "06",
      title: "Launch",
      description:
        "We configure the production environment, connect the domain, verify analytics, complete final checks, and launch the website.",
      icon: Rocket,
    },
    {
      number: "07",
      title: "Optimization & Growth",
      description:
        "After launch, we use analytics, search data, customer behavior, and business feedback to guide future improvements.",
      icon: BarChart3,
    },
  ] satisfies readonly ProcessItem[],
} as const;

export const websiteFAQ = {
  eyebrow: "Website Development FAQ",
  title: "Common questions about building your website.",
  description:
    "Every project is different, but these answers cover the questions businesses ask most often before starting a website project.",
  items: [
    {
      question: "How much does a custom website cost?",
      answer:
        "Pricing depends on the number of pages, design requirements, integrations, content needs, custom functionality, and overall project scope. After discovery, we provide a clear proposal based on what your business actually needs.",
    },
    {
      question: "How long does a website project take?",
      answer:
        "Most business websites take several weeks from discovery through launch. Larger websites, custom applications, advanced integrations, or projects requiring significant content work may take longer.",
    },
    {
      question: "Will I own my website?",
      answer:
        "Yes. Once the project is completed and paid for, you own the website and its content. We can continue managing and supporting it, but you are not locked into a proprietary website platform.",
    },
    {
      question: "Can you redesign my existing website?",
      answer:
        "Yes. We can evaluate your existing site, preserve valuable content and search equity, improve the design and structure, and rebuild it on a modern technical foundation.",
    },
    {
      question: "Do you help with website content?",
      answer:
        "Yes. We can help organize your messaging, improve existing copy, write service-page content, plan calls to action, and structure information around your customers and search goals.",
    },
    {
      question: "Will the website work on phones and tablets?",
      answer:
        "Yes. Every website is designed and tested for mobile phones, tablets, laptops, and larger desktop screens.",
    },
    {
      question: "Is SEO included with the website?",
      answer:
        "Every website includes a strong technical SEO foundation, including semantic structure, metadata, performance optimization, mobile usability, and crawlable page architecture. Ongoing Local SEO and content campaigns can be added separately.",
    },
    {
      question: "Can you manage hosting and maintenance?",
      answer:
        "Yes. We can manage deployment, hosting, updates, monitoring, backups, analytics, technical maintenance, and ongoing improvements after launch.",
    },
    {
      question: "Can the website connect to other business tools?",
      answer:
        "Yes. Depending on the project, we can connect forms, email platforms, CRMs, scheduling systems, analytics tools, APIs, databases, payment systems, and automation workflows.",
    },
    {
      question: "Can the website grow into a larger application later?",
      answer:
        "Yes. We use modern, scalable architecture so the website can later expand into customer portals, dashboards, booking systems, automation tools, internal applications, or other custom software.",
    },
  ] satisfies readonly FAQItem[],
} as const;

export const websiteCapabilities = {
  eyebrow: "Technical Capabilities",
  title: "More than a basic business website.",
  description:
    "We combine modern web development, integrations, automation, analytics, and scalable architecture to build digital systems that support real business growth.",
  items: [
    {
      title: "Custom Web Development",
      description:
        "Purpose-built websites and applications developed around your business, customers, workflows, and long-term goals.",
      icon: Code2,
    },
    {
      title: "Responsive Interfaces",
      description:
        "Mobile-first layouts that provide a consistent, intuitive experience across phones, tablets, laptops, and large displays.",
      icon: Smartphone,
    },
    {
      title: "Performance Optimization",
      description:
        "Fast-loading pages, optimized assets, efficient code, and modern rendering strategies designed to improve user experience.",
      icon: Gauge,
    },
    {
      title: "Technical SEO",
      description:
        "Search-friendly architecture, semantic markup, metadata, internal linking, crawlability, and structured page foundations.",
      icon: Search,
    },
    {
      title: "API Integrations",
      description:
        "Connections between your website and CRMs, scheduling platforms, payment systems, email tools, and third-party services.",
      icon: Link2,
    },
    {
      title: "Business Automation",
      description:
        "Automated workflows that reduce repetitive work, improve lead handling, and connect your website to business operations.",
      icon: Workflow,
    },
    {
      title: "Database Solutions",
      description:
        "Structured data storage and secure backend systems for customer portals, dashboards, internal tools, and custom applications.",
      icon: Database,
    },
    {
      title: "AI Integration",
      description:
        "Practical AI tools for customer communication, content workflows, internal processes, lead qualification, and business insights.",
      icon: Bot,
    },
    {
      title: "Secure Architecture",
      description:
        "Modern authentication, secure deployment practices, dependency management, validation, and scalable application foundations.",
      icon: ShieldCheck,
    },
  ] satisfies readonly CapabilityItem[],
} as const;

export const websiteIndustries = {
  eyebrow: "Industries We Serve",
  title: "Web solutions built around your business.",
  description:
    "We work with local businesses, professional service companies, contractors, and growing organizations that need a stronger digital presence and better business systems.",
  items: [
    {
      title: "Automotive Businesses",
      description:
        "Websites for repair shops, performance shops, dealerships, detailers, fabricators, towing companies, and automotive service providers.",
      icon: Car,
    },
    {
      title: "Contractors & Home Services",
      description:
        "Lead-focused websites for HVAC companies, electricians, plumbers, roofers, landscapers, builders, and other service contractors.",
      icon: Wrench,
    },
    {
      title: "Professional Services",
      description:
        "Credible, polished websites for consultants, financial professionals, agencies, accountants, and business service providers.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Legal Services",
      description:
        "Professional websites designed to communicate expertise, organize practice areas, build trust, and generate qualified inquiries.",
      icon: Scale,
    },
    {
      title: "Healthcare & Wellness",
      description:
        "Accessible, trustworthy websites for medical offices, clinics, wellness providers, therapists, and health-related businesses.",
      icon: HeartPulse,
    },
    {
      title: "Real Estate",
      description:
        "Modern websites for agents, brokers, investors, property managers, builders, and real estate service companies.",
      icon: House,
    },
    {
      title: "Restaurants & Hospitality",
      description:
        "Mobile-friendly websites for restaurants, venues, event spaces, food services, and hospitality businesses.",
      icon: Utensils,
    },
    {
      title: "Retail & E-commerce",
      description:
        "Digital storefronts and product-focused websites that make it easier for customers to browse, engage, and purchase.",
      icon: ShoppingBag,
    },
    {
      title: "Growing Organizations",
      description:
        "Scalable websites and business applications for companies that need custom workflows, integrations, portals, or internal tools.",
      icon: Building2,
    },
  ] satisfies readonly IndustryItem[],
} as const;
