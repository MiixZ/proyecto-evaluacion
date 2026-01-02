import { persistentAtom } from "@nanostores/persistent";
import { ui, defaultLang, type TranslationKey } from "../i18n/ui";

export type Lang = keyof typeof ui;

export const $locale = persistentAtom<Lang>("locale", defaultLang);

export function t(key: TranslationKey): string {
  const locale = $locale.get();

  return ui[locale][key] || ui[defaultLang][key] || key;
}

export function setLanguage(lang: Lang) {
  $locale.set(lang);
}

export { ui };
