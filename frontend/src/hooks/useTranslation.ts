import { useStore } from "@nanostores/react";
import { $locale, ui, type Lang } from "../store/i18nStore";

export function useTranslation() {
  const locale = useStore($locale);

  function t(key: keyof typeof ui.es) {
    return ui[locale][key] || ui["es"][key] || key;
  }

  return { t, locale, setLanguage: (l: Lang) => $locale.set(l) };
}
