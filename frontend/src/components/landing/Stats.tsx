const stats = [
  { value: "5+", label: "Lenguajes" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 1s", label: "Latencia media" },
  { value: "24/7", label: "Acceso" },
];

export const Stats = () => {
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
