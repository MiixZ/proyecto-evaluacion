import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Stats } from "@/components/landing/Stats";
import { Link } from "react-router-dom";
import { CheckCircle2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/forms/button";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <Hero />
        <Stats />
        <Features />

        {/* CTA Section - Mantenido aquí por simplicidad o puede extraerse también */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-left scale-110" />
          <div className="container relative px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("landing.cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("landing.cta.subtitle")}
              </p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20"
                  asChild>
                  <Link to="/login">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {t("landing.cta.button")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-12 border-t border-border bg-card/20">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xl font-bold text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <span>{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-primary transition-colors">
              {t("landing.footer.privacy")}
            </Link>
            <Link to="#" className="hover:text-primary transition-colors">
              {t("landing.footer.terms")}
            </Link>
            <Link to="#" className="hover:text-primary transition-colors">
              {t("landing.footer.contact")}
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("app.name")} Project.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
