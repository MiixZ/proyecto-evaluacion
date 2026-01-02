import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Zap,
  Shield,
  BarChart3,
  Users,
  FileCode,
  GraduationCap,
} from "lucide-react";

export const Features = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Zap, key: "evaluation" },
    { icon: Shield, key: "security" },
    { icon: BarChart3, key: "metrics" },
    { icon: Users, key: "teaching" },
    { icon: FileCode, key: "multilang" },
    { icon: GraduationCap, key: "curriculum" },
  ];

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 border-primary/10 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  {t(`landing.features.items.${feature.key}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t(`landing.features.items.${feature.key}.desc`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
