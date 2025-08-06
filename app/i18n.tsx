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

export type Language = string;

const localeCache: Record<string, Record<string, string>> = {};

async function loadLocale(lang: Language): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("load_language", { lang });
}

interface LangContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: Record<string, string>;
  availableLanguages: string[];
  languageNames: Record<string, string>;
}

const LangCtx = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  translations: {},
  availableLanguages: [],
  languageNames: {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (!localeCache["en"]) {
      (async () => {
        try {
          const map = await loadLocale("en");
          localeCache["en"] = map;
        } catch (err) {
          console.error(err);
          console.warn(
            "Failed to load English locale; translations may be incomplete.",
          );
        }
      })();
    }
    if (localeCache[newLang]) {
      setTranslations(localeCache[newLang]!);
    } else {
      (async () => {
        try {
          const map = await loadLocale(newLang);
          localeCache[newLang] = map;
          setTranslations(map);
        } catch (err) {
          console.error(err);
          console.warn(
            `Failed to load locale ${newLang}; falling back to English.`,
          );
          setTranslations(localeCache["en"] ?? {});
          setLangState("en");
        }
      })();
    }
  };

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    const init = async () => {
      try {
        const langs = (await invoke<string[]>("get_languages")).sort();
        setAvailableLanguages(langs);
        const names: Record<string, string> = {};
        langs.forEach((code) => {
          const name =
            new Intl.DisplayNames([code], { type: "language" }).of(code) || code;
          names[code] = name[0].toLocaleUpperCase() + name.slice(1);
        });
        setLanguageNames(names);
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
        if (!localeCache["en"]) {
          try {
            localeCache["en"] = await loadLocale("en");
          } catch (err) {
            console.error(err);
            console.warn(
              "Failed to load English locale; translations may be incomplete.",
            );
            localeCache["en"] = {};
          }
        }
        if (!localeCache[chosen]) {
          if (chosen === "en") {
            localeCache[chosen] = localeCache["en"]!;
          } else {
            try {
              localeCache[chosen] = await loadLocale(chosen);
            } catch (err) {
              console.error(err);
              console.warn(
                `Failed to load locale ${chosen}; falling back to English.`,
              );
              chosen = "en";
              localeCache[chosen] = localeCache["en"]!;
            }
          }
        }
        setTranslations(localeCache[chosen]!);
        setLangState(chosen);
      } catch (err) {
        console.error(err);
        console.warn("Failed to initialize languages.");
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
    <LangCtx.Provider
      value={{ lang, setLang, translations, availableLanguages, languageNames }}
    >
      {children}
    </LangCtx.Provider>
  );
}

export function useLanguage() {
  return useContext(LangCtx);
}

export function useT() {
  const { translations } = useLanguage();
  return (
    key: string,
    params?: Record<string, string | number>,
  ): string => {
    let str =
      translations[key] ?? localeCache["en"]?.[key] ?? key;
    if (params) {
      for (const [placeholder, value] of Object.entries(params)) {
        str = str.replaceAll(`{${placeholder}}`, String(value));
      }
    }
    return str;
  };
}

export async function tForLang(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
): Promise<string> {
  if (!localeCache[lang]) {
    try {
      const map = await loadLocale(lang);
      localeCache[lang] = map;
    } catch (err) {
      console.error(err);
      localeCache[lang] = localeCache["en"] ?? {};
    }
  }
  let str = localeCache[lang]?.[key] ?? localeCache["en"]?.[key] ?? key;
  if (params) {
    for (const [placeholder, value] of Object.entries(params)) {
      str = str.replaceAll(`{${placeholder}}`, String(value));
    }
  }
  return str;
}
