"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { once, type UnlistenFn } from "@tauri-apps/api/event";

export type Language = string;

const localeCache: Record<string, Record<string, string>> = {};

async function loadLocale(lang: Language): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("load_language", { lang });
}

async function fetchLocale(lang: Language): Promise<Record<string, string>> {
  if (localeCache[lang]) {
    return localeCache[lang]!;
  }
  const map = await loadLocale(lang);
  localeCache[lang] = map;
  return map;
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

  const latestRequest = useRef<Language>(lang);

  const setLang = (newLang: Language) => {
    latestRequest.current = newLang;
    setLangState(newLang);
    fetchLocale("en").catch((err) => {
      console.error(err);
      console.warn(
        "Failed to load English locale; translations may be incomplete.",
      );
      localeCache["en"] = localeCache["en"] ?? {};
    });
    if (localeCache[newLang]) {
      setTranslations(localeCache[newLang]!);
      return;
    }
    (async () => {
      try {
        const map = await fetchLocale(newLang);
        if (latestRequest.current === newLang) {
          setTranslations(map);
        }
      } catch (err) {
        console.error(err);
        console.warn(
          `Failed to load locale ${newLang}; falling back to English.`,
        );
        if (latestRequest.current === newLang) {
          setTranslations(localeCache["en"] ?? {});
          setLangState("en");
        }
      }
    })();
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
        try {
          await fetchLocale("en");
        } catch (err) {
          console.error(err);
          console.warn(
            "Failed to load English locale; translations may be incomplete.",
          );
          localeCache["en"] = {};
        }
        let map: Record<string, string>;
        try {
          map = await fetchLocale(chosen);
        } catch (err) {
          console.error(err);
          console.warn(
            `Failed to load locale ${chosen}; falling back to English.`,
          );
          chosen = "en";
          map = localeCache["en"] ?? {};
        }
        setTranslations(map);
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

function formatTranslation(
  map: Record<string, string>,
  key: string,
  params?: Record<string, string | number>,
): string {
  let str = map[key] ?? localeCache["en"]?.[key] ?? key;
  if (params) {
    for (const [placeholder, value] of Object.entries(params)) {
      str = str.replaceAll(`{${placeholder}}`, String(value));
    }
  }
  return str;
}

export function useT() {
  const { translations } = useLanguage();
  return (
    key: string,
    params?: Record<string, string | number>,
  ): string => formatTranslation(translations, key, params);
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
  return formatTranslation(localeCache[lang]!, key, params);
}
