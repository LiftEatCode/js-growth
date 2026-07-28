export type InvestmentPackage = {
    name: string;
    description: string;
    price: string;
    featured?: boolean;
    features: string[];
    cta: string;
  };
  
  export type InvestmentAddon = {
    name: string;
    price: string;
    description: string;
  };
  
  export type InvestmentFaq = {
    question: string;
    answer: string;
  };
  
  export const investmentPackages: InvestmentPackage[] = [
    {
      name: "Starter Website",
      description:
        "A professional website for small businesses that need a strong, credible online presence.",
      price: "$1,500",
      features: [
        "Custom responsive website",
        "Up to 5 core pages",
        "Mobile and tablet optimization",
        "Contact form integration",
        "Basic on-page SEO",
        "Google Analytics setup",
        "Google Search Console setup",
        "Performance optimization",
        "30 days of post-launch support",
      ],
      cta: "Start Your Website",
    },
    {
      name: "Growth Package",
      description:
        "A complete website and local visibility package designed to generate more calls, messages, and leads.",
      price: "$2,995",
      featured: true,
      features: [
        "Everything in Starter Website",
        "Local SEO setup",
        "Google Business Profile optimization",
        "Local keyword research",
        "Conversion-focused page structure",
        "Lead tracking setup",
        "Advanced contact form",
        "Performance reporting",
        "60 days of post-launch support",
      ],
      cta: "Build My Growth Package",
    },
    {
      name: "Growth System",
      description:
        "A custom growth platform combining your website, automation, analytics, and business systems.",
      price: "$4,995",
      features: [
        "Everything in Growth Package",
        "AI and workflow automation",
        "CRM or software integrations",
        "Custom lead management workflows",
        "Automated follow-up systems",
        "Business process automation",
        "Custom analytics dashboard",
        "Monthly strategy consultation",
        "Priority support",
      ],
      cta: "Build My Growth System",
    },
  ];
  
  export const investmentAddons: InvestmentAddon[] = [
    {
      name: "Website Maintenance",
      price: "$99/month",
      description:
        "Ongoing updates, backups, monitoring, and technical support.",
    },
    {
      name: "Managed Hosting",
      price: "$39/month",
      description:
        "Fast, secure hosting with performance and uptime monitoring.",
    },
    {
      name: "Monthly Local SEO",
      price: "$500/month",
      description:
        "Ongoing local optimization, keyword targeting, content, and reporting.",
    },
    {
      name: "Google Business Profile",
      price: "$300",
      description:
        "Profile optimization, category setup, service updates, and local visibility improvements.",
    },
    {
      name: "Additional Website Pages",
      price: "$150/page",
      description:
        "Additional service, location, landing, or informational pages.",
    },
    {
      name: "Blog Setup",
      price: "$300",
      description:
        "A search-friendly blog system with categories and reusable post templates.",
    },
    {
      name: "AI Chatbot",
      price: "$750",
      description:
        "A website chatbot customized around your business, services, and customer questions.",
    },
    {
      name: "Custom Automation",
      price: "Starting at $1,500",
      description:
        "Automated workflows, notifications, lead routing, and custom business integrations.",
    },
  ];
  
  export const investmentFaqs: InvestmentFaq[] = [
    {
      question: "How long does a website project take?",
      answer:
        "Most small business websites take approximately three to six weeks, depending on the number of pages, content requirements, feedback, and requested functionality.",
    },
    {
      question: "Do I own my website?",
      answer:
        "Yes. Once the project is paid in full, you own the website and the custom work created for your business.",
    },
    {
      question: "Can I make payments?",
      answer:
        "Yes. Most projects are split into milestone payments, typically with an initial deposit and the remaining balance divided across the project.",
    },
    {
      question: "Do you redesign existing websites?",
      answer:
        "Yes. Existing websites can be redesigned, rebuilt, optimized, or migrated to a more modern platform.",
    },
    {
      question: "Can you work with my current website?",
      answer:
        "In many cases, yes. The current website will first be reviewed to determine whether improving it or rebuilding it would provide the best result.",
    },
    {
      question: "Are these final prices?",
      answer:
        "The listed prices are starting points. Final pricing depends on the project scope, number of pages, integrations, content needs, automation requirements, and overall complexity.",
    },
    {
      question: "Do you offer ongoing support?",
      answer:
        "Yes. Website maintenance, hosting, Local SEO, reporting, automation support, and continued development are available after launch.",
    },
    {
      question: "What happens after I submit a request?",
      answer:
        "Your business, goals, website, and requested services will be reviewed. JS Solutions will then contact you to discuss the best approach, timeline, and estimated investment.",
    },
  ];
  
  export const investmentHighlights = [
    "Clear project scope",
    "Milestone-based payments",
    "No unnecessary long-term contracts",
    "Custom solutions built around your business",
  ];