import { useTranslation } from "react-i18next";

export const Stats = () => {
  const { t } = useTranslation();

  const stats = [
    { value: "5+", label: t("landing.stats.languages") },
    { value: "99.9%", label: t("landing.stats.uptime") },
    { value: "< 1s", label: t("landing.stats.latency") },
    { value: "24/7", label: t("landing.stats.access") },
  ];

  return (
    <section className="py-12 border-y border-border bg-card/30">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
