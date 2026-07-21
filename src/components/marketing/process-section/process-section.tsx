import { Container, Section, SectionHeader } from "@/components/ui";

import type { ProcessSectionProps } from "./types";

export function ProcessSection({
  eyebrow,
  title,
  description,
  items,
  className,
  theme = "dark",
}: ProcessSectionProps) {
  const isDark = theme === "dark";

  return (
    <Section
      className={[
        "relative overflow-hidden",
        isDark ? "bg-brand text-white" : "bg-background text-brand",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isDark && (
        <>
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 size-[30rem] -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-blue/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 size-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-cyan/10 blur-3xl"
          />
        </>
      )}

      <Container className="relative">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
          className={
            isDark
              ? "[&_h2]:text-white [&_p:last-child]:text-slate-300"
              : undefined
          }
        />

        <ol className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden="true"
            className={[
              "absolute bottom-0 left-6 top-0 hidden w-px md:block",
              isDark
                ? "bg-gradient-to-b from-brand-blue via-brand-cyan to-transparent"
                : "bg-gradient-to-b from-brand-blue via-brand-cyan to-border",
            ].join(" ")}
          />

          <div className="space-y-6">
            {items.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;

              return (
                <li key={step.number} className="relative md:pl-20">
                  <div
                    className={[
                      "absolute left-0 top-7 z-10 hidden size-12 items-center justify-center rounded-2xl md:flex",
                      isDark
                        ? "border border-white/10 bg-slate-950 text-cyan-300 shadow-xl"
                        : "border border-border bg-white text-brand-blue shadow-card",
                    ].join(" ")}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </div>

                  <article
                    className={[
                      "rounded-2xl border p-6 transition duration-300 hover:-translate-y-1",
                      isDark
                        ? "border-white/10 bg-white/[0.05] shadow-xl backdrop-blur-xl hover:bg-white/[0.08]"
                        : "border-border bg-white shadow-card hover:border-blue-200",
                      isEven ? "md:ml-12" : "md:mr-12",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          "flex size-11 shrink-0 items-center justify-center rounded-xl md:hidden",
                          isDark
                            ? "border border-white/10 bg-white/[0.06] text-cyan-300"
                            : "bg-blue-50 text-brand-blue",
                        ].join(" ")}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={[
                              "font-heading text-sm font-semibold",
                              isDark ? "text-cyan-300" : "text-brand-blue",
                            ].join(" ")}
                          >
                            {step.number}
                          </span>

                          <h3
                            className={[
                              "font-heading text-xl font-semibold",
                              isDark ? "text-white" : "text-brand",
                            ].join(" ")}
                          >
                            {step.title}
                          </h3>
                        </div>

                        <p
                          className={[
                            "mt-3 leading-7",
                            isDark ? "text-slate-300" : "text-muted",
                          ].join(" ")}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </div>
        </ol>
      </Container>
    </Section>
  );
}