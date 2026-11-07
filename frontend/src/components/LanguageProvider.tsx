"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Locale } from "@/lib/i18n";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void };
const LanguageContext = createContext<Ctx>({ locale: "ar", setLocale: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale) || "ar";
    setLocaleState(saved);
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  return useContext(LanguageContext);
}