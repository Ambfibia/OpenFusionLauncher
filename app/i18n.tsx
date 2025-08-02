"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { once, type UnlistenFn } from "@tauri-apps/api/event";
import type { TranslationKey } from "./i18n-keys";

export const availableLanguages: string[] = [];
export type Language = string;
export const languageNames: Record<string, string> = {};

const localeCache: Record<string, Partial<Record<TranslationKey, string>>> = {};

async function loadLocale(
  lang: Language,
): Promise<Partial<Record<TranslationKey, string>>> {
  return invoke<Record<TranslationKey, string>>("load_language", { lang });
}

interface LangContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: Partial<Record<TranslationKey, string>>;
}

const LangCtx = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  translations: {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [translations, setTranslations] =
    useState<Partial<Record<TranslationKey, string>>>({});

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (localeCache[newLang]) {
      setTranslations(localeCache[newLang]!);
    } else {
      loadLocale(newLang).then((map) => {
        localeCache[newLang] = map;
        setTranslations(map);
      });
    }
  };

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    const init = async () => {
      try {
        if (!localeCache["en"]) {
          localeCache["en"] = await loadLocale("en");
        }
        const langs = await invoke<string[]>("get_languages");
        availableLanguages.splice(0, availableLanguages.length, ...langs);
        langs.forEach((code) => {
          const name =
            new Intl.DisplayNames([code], { type: "language" }).of(code) || code;
          languageNames[code] = name;
        });
        let chosen = "en";
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("lang");
          if (stored && langs.includes(stored)) {
            chosen = stored;
          } else {
            await invoke("reload_state");
            const cfg = await invoke<{ launcher: { language: string } }>(
              "get_config",
            );
            if (langs.includes(cfg.launcher.language)) {
              chosen = cfg.launcher.language;
            }
          }
        }
        if (!localeCache[chosen]) {
          localeCache[chosen] = await loadLocale(chosen);
        }
        setTranslations(localeCache[chosen]!);
        setLangState(chosen);
      } catch {
        // ignore errors
      }
    };
    init();
    once("tauri://ready", init).then((fn) => {
      unlisten = fn;
    });
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, setLang, translations }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLanguage() {
  return useContext(LangCtx);
}

export function useT() {
  const { translations, lang } = useLanguage();
  return (key: TranslationKey, params?: Record<string, string>) => {
    let text = translations[key];
    if (text === undefined) {
      const fallback = localeCache["en"];
      if (fallback && fallback[key] !== undefined) {
        console.warn(
          `Missing translation for key "${key}" in "${lang}", falling back to English.`,
        );
        text = fallback[key];
      } else {
        console.warn(
          `Missing translation for key "${key}" in "${lang}" and English.`,
        );
        text = key;
      }
    }
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${name}\\}`, "g"), value);
      }
    }
    return text;
  };
}

export type { TranslationKey } from "./i18n-keys";
