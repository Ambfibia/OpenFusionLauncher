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
const loadingLocales: Record<string, Promise<void>> = {};

async function loadLocale(lang: Language): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("load_language", { lang });
}

interface LangContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: Record<string, string>;
  availableLanguages: string[];
  languageNames: Record<string, string>;
  ensureLangLoaded: () => Promise<void>;
}

const LangCtx = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  translations: {},
  availableLanguages: [],
  languageNames: {},
  ensureLangLoaded: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (localeCache[newLang]) {
      setTranslations(localeCache[newLang]!);
    } else {
      setTranslations({});
    }
  };

  const ensureLangLoaded = async () => {
    if (!localeCache[lang]) {
      if (!loadingLocales[lang]) {
        loadingLocales[lang] = loadLocale(lang).then((map) => {
          localeCache[lang] = map;
        });
      }
      await loadingLocales[lang];
    }
    setTranslations(localeCache[lang]!);
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
        if (localeCache[chosen]) {
          setTranslations(localeCache[chosen]!);
        }
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
    <LangCtx.Provider
      value={{
        lang,
        setLang,
        translations,
        availableLanguages,
        languageNames,
        ensureLangLoaded,
      }}
    >
      {children}
    </LangCtx.Provider>
  );
}

export function useLanguage() {
  return useContext(LangCtx);
}

export function useT() {
  const { translations, ensureLangLoaded } = useLanguage();
  return (key: string) => {
    if (Object.keys(translations).length === 0) {
      void ensureLangLoaded();
    }
    return translations[key] || key;
  };
}
