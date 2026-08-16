export const siteConfig = {
  name: "JS Solutions",

  url: "https://js-growth.com",

  domain: "js-growth.com",

  tagline:
    "Grow Your Business. We Build Solutions.",

  description:
    "Helping local businesses grow with high-performance websites, Local SEO, AI automation, and software-driven marketing.",

  primaryCta: {
    name: "Free Website Audit",
    href: "/website-audit",
  },

  navigation: [
    {
      name: "Services",

      items: [
        {
          name: "All Services",
          description:
            "Explore the complete range of JS Solutions growth services.",
          href: "/services",
        },

        {
          name: "Website Development",
          description:
            "High-performance websites built to generate leads and support growth.",
          href: "/websites",
        },

        {
          name: "Local SEO",
          description:
            "Improve local visibility and reach customers searching nearby.",
          href: "/local-seo",
        },

        {
          name: "AI Automation",
          description:
            "Use AI and automation to reduce repetitive work and improve operations.",
          href: "/ai-automation",
        },
      ],
    },

    {
      name: "Work",

      items: [
        {
          name: "Projects",
          description:
            "See examples of websites, software, and growth systems we have built.",
          href: "/projects",
        },
      ],
    },

    {
      name: "Resources",

      items: [
        {
          name: "Blog",
          description:
            "Practical insights about websites, SEO, AI, automation, and business growth.",
          href: "/blog",
        },

        {
          name: "Investment",
          description:
            "Learn how JS Solutions approaches project scope and investment.",
          href: "/investment",
        },

        {
          name: "Website Growth Audit",
          description:
            "See what is holding your website back — search, content, conversion, local visibility, and technical health.",
          href: "/website-audit",
        },
      ],
    },

    {
      name: "Company",

      items: [
        {
          name: "About",
          description:
            "Learn how JS Solutions combines software, marketing, and business strategy.",
          href: "/about",
        },

        {
          name: "Contact",
          description:
            "Tell us what you are working on and start a conversation.",
          href: "/contact",
        },
      ],
    },
  ],
} as const;