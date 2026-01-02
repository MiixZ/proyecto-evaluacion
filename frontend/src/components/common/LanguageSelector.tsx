import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

export const LanguageSelector = () => {
  const { locale, setLanguage } = useTranslation();

  return (
    <div className="flex gap-2">
      <Button
        variant={locale === "es" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("es")}>
        ES
      </Button>

      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("en")}>
        EN
      </Button>
    </div>
  );
};
