export type FAQItem = {
    question: string;
    answer: string;
  };
  
  export type FAQSectionProps = {
    eyebrow: string;
    title: string;
    description?: string;
    items: readonly FAQItem[];
    className?: string;
  };