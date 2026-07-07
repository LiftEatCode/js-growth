import { services } from "@/data/services";

export function ServicesSection() {
  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
            Services
          </p>

          <h2 className="mt-3 font-heading text-4xl font-bold text-brand md:text-5xl">
            Everything your local business needs to grow online.
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted">
            JS Solutions combines software engineering, SEO, AI, automation, and
            marketing strategy into one growth system.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="rounded-2xl border border-border bg-card p-8 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                  <Icon className="size-6" />
                </div>

                <h3 className="font-heading text-xl font-semibold text-brand">
                  {service.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}