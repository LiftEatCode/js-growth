import {
    BarChart3,
    Bot,
    BrainCircuit,
    BriefcaseBusiness,
    Building2,
    ClipboardList,
    FileText,
    HeartPulse,
    Lightbulb,
    Mail,
    MessageSquareText,
    Network,
    RefreshCw,
    Rocket,
    Search,
    Settings2,
    ShoppingBag,
    Sparkles,
    TestTube2,
    Users,
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
  
  export const aiAutomationBenefits = {
    eyebrow: "AI Integration & Automation",
    title: "Use AI to reduce busywork and improve your business.",
    description:
      "We help businesses apply artificial intelligence and automation to real operational problems—not just add technology for the sake of it.",
    items: [
      {
        title: "Save Time",
        description:
          "Automate repetitive administrative work so your team can focus on customers, projects, strategy, and revenue-producing activities.",
        icon: RefreshCw,
      },
      {
        title: "Respond Faster",
        description:
          "Use automated communication and intelligent workflows to answer inquiries, route leads, and follow up more consistently.",
        icon: MessageSquareText,
      },
      {
        title: "Improve Consistency",
        description:
          "Create reliable processes that follow the same business rules every time, reducing missed steps and manual errors.",
        icon: Workflow,
      },
      {
        title: "Use Business Data Better",
        description:
          "Turn scattered information into useful summaries, reports, recommendations, and searchable knowledge.",
        icon: BarChart3,
      },
      {
        title: "Support Your Team",
        description:
          "Give employees practical AI tools that help them find information, draft content, complete tasks, and make better decisions.",
        icon: Users,
      },
      {
        title: "Scale Operations",
        description:
          "Build systems that allow your business to handle more customers and work without increasing manual effort at the same rate.",
        icon: Rocket,
      },
    ] satisfies readonly BenefitItem[],
  } as const;
  
  export const aiAutomationCapabilities = {
    eyebrow: "AI & Automation Capabilities",
    title: "Practical systems built around your workflows.",
    description:
      "We combine software development, artificial intelligence, integrations, and workflow automation to create solutions that fit how your business actually operates.",
    items: [
      {
        title: "AI Assistants",
        description:
          "Custom assistants that help your team answer questions, summarize information, draft content, and complete routine tasks.",
        icon: Bot,
      },
      {
        title: "Customer Communication",
        description:
          "AI-supported chat, email, intake, follow-up, and response workflows designed to improve communication without losing the human touch.",
        icon: MessageSquareText,
      },
      {
        title: "Lead Qualification",
        description:
          "Collect, organize, score, and route incoming leads based on your services, availability, location, budget, or other business rules.",
        icon: Search,
      },
      {
        title: "Document Processing",
        description:
          "Extract, classify, summarize, and organize information from forms, emails, PDFs, reports, invoices, and other business documents.",
        icon: FileText,
      },
      {
        title: "Email Automation",
        description:
          "Automate confirmations, reminders, follow-ups, internal notifications, customer updates, and personalized email workflows.",
        icon: Mail,
      },
      {
        title: "Workflow Automation",
        description:
          "Connect multi-step business processes across forms, databases, CRMs, calendars, email platforms, and internal systems.",
        icon: Workflow,
      },
      {
        title: "Knowledge Systems",
        description:
          "Create searchable internal knowledge tools using company procedures, documentation, service information, and approved business data.",
        icon: BrainCircuit,
      },
      {
        title: "Data & Reporting",
        description:
          "Transform operational data into dashboards, recurring reports, alerts, summaries, and actionable business insights.",
        icon: BarChart3,
      },
      {
        title: "Custom Integrations",
        description:
          "Connect websites, applications, APIs, databases, CRMs, scheduling tools, payment platforms, and other business software.",
        icon: Network,
      },
    ] satisfies readonly CapabilityItem[],
  } as const;
  
  export const aiAutomationProcess = {
    eyebrow: "Our AI Automation Process",
    title: "A practical path from opportunity to implementation.",
    description:
      "We begin with your business problem, identify the right technology, and build a solution that your team can realistically use and maintain.",
    items: [
      {
        number: "01",
        title: "Workflow Discovery",
        description:
          "We review your current processes, repetitive tasks, bottlenecks, communication gaps, data sources, and business goals.",
        icon: ClipboardList,
      },
      {
        number: "02",
        title: "Opportunity Analysis",
        description:
          "We identify where automation or AI can create measurable value and where traditional software may be the better solution.",
        icon: Lightbulb,
      },
      {
        number: "03",
        title: "Solution Design",
        description:
          "We map the workflow, define business rules, select integrations, establish data requirements, and plan the user experience.",
        icon: Settings2,
      },
      {
        number: "04",
        title: "Prototype",
        description:
          "We build and validate a focused version of the solution before investing in a larger implementation.",
        icon: Sparkles,
      },
      {
        number: "05",
        title: "Development & Integration",
        description:
          "We build the automation, connect required systems, configure AI behavior, and implement appropriate security controls.",
        icon: Network,
      },
      {
        number: "06",
        title: "Testing",
        description:
          "We test workflow logic, data handling, integrations, edge cases, failure scenarios, permissions, and output quality.",
        icon: TestTube2,
      },
      {
        number: "07",
        title: "Launch & Training",
        description:
          "We deploy the solution, document the process, and help your team understand how to use and manage it.",
        icon: Rocket,
      },
      {
        number: "08",
        title: "Optimization",
        description:
          "We review performance, accuracy, adoption, cost, and business results to guide continued improvements.",
        icon: BarChart3,
      },
    ] satisfies readonly ProcessItem[],
  } as const;
  
  export const aiAutomationIndustries = {
    eyebrow: "Industries We Support",
    title: "AI and automation adapted to your business.",
    description:
      "The best automation strategy depends on your customers, services, employees, existing software, and operational requirements.",
    items: [
      {
        title: "Automotive Businesses",
        description:
          "Automate lead intake, service reminders, estimate follow-ups, customer updates, review requests, inventory workflows, and internal communication.",
        icon: Wrench,
      },
      {
        title: "Contractors & Home Services",
        description:
          "Improve estimate requests, appointment scheduling, lead qualification, dispatch communication, follow-ups, and customer notifications.",
        icon: Settings2,
      },
      {
        title: "Professional Services",
        description:
          "Streamline client intake, document preparation, internal research, recurring reports, communication, and knowledge management.",
        icon: BriefcaseBusiness,
      },
      {
        title: "Healthcare & Wellness",
        description:
          "Support administrative workflows, appointment communication, internal knowledge access, documentation, and approved patient-facing processes.",
        icon: HeartPulse,
      },
      {
        title: "Retail & E-commerce",
        description:
          "Improve product support, customer communication, order workflows, inventory reporting, marketing content, and operational analysis.",
        icon: ShoppingBag,
      },
      {
        title: "Growing Organizations",
        description:
          "Connect departments, databases, internal systems, reporting tools, and repeatable workflows as operational complexity increases.",
        icon: Building2,
      },
    ] satisfies readonly IndustryItem[],
  } as const;
  
  export const aiAutomationFAQ = {
    eyebrow: "AI Automation FAQ",
    title: "Common questions about AI and business automation.",
    description:
      "Successful AI projects require clear goals, appropriate data, reliable workflows, thoughtful security, and realistic expectations.",
    items: [
      {
        question: "What business tasks can AI automate?",
        answer:
          "AI can assist with customer communication, lead intake, document processing, information retrieval, content drafting, summaries, classification, reporting, and workflow decisions. Traditional automation is often used alongside AI for predictable business rules.",
      },
      {
        question: "Does my business need custom AI software?",
        answer:
          "Not always. Some businesses can benefit from configuring existing tools, while others need custom integrations or applications. We evaluate the problem first and recommend the simplest solution that can meet your needs.",
      },
      {
        question: "Will AI replace my employees?",
        answer:
          "Our goal is usually to support employees rather than replace them. AI can reduce repetitive work, help teams access information faster, and create more time for work that requires experience, judgment, relationships, and creativity.",
      },
      {
        question: "Can AI connect with our existing software?",
        answer:
          "In many cases, yes. Integration depends on whether your current tools provide APIs, webhooks, database access, exports, or other supported connection methods.",
      },
      {
        question: "Is business data kept secure?",
        answer:
          "Security depends on the systems, vendors, data, and architecture involved. We design solutions with access controls, data minimization, validation, secure integrations, and appropriate handling practices based on the project.",
      },
      {
        question: "Can AI make mistakes?",
        answer:
          "Yes. AI-generated output can be incomplete or incorrect. High-impact workflows should include validation, approved data sources, clear limitations, human review, and safeguards appropriate to the risk involved.",
      },
      {
        question: "How much does AI automation cost?",
        answer:
          "Pricing depends on the number of workflows, integrations, users, data sources, custom development requirements, AI usage, and ongoing support needs. We begin by defining the business case and project scope.",
      },
      {
        question: "How long does an automation project take?",
        answer:
          "A focused workflow may be completed relatively quickly, while projects involving multiple systems, custom interfaces, large data sources, or complex approval rules require more planning and development.",
      },
      {
        question: "Can we start with one small automation?",
        answer:
          "Yes. Starting with a focused, measurable workflow is often the best approach. It allows us to validate the value, improve the process, and establish a foundation for future automation.",
      },
      {
        question: "Do you provide ongoing support?",
        answer:
          "Yes. Automation and AI systems may require monitoring, vendor updates, prompt or workflow adjustments, usage reviews, security maintenance, and continued optimization.",
      },
    ] satisfies readonly FAQItem[],
  } as const;