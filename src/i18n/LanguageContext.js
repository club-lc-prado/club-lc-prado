import { createContext, useContext, useState } from "react";
import translations from "./translations";

const LanguageContext = createContext();

function detectBrowserLang() {
  const saved = localStorage.getItem("club_lang");
  if (saved) return saved;

  const browserLang = (navigator.language || navigator.userLanguage || "").toLowerCase();

  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("uk")) return "ua";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("en")) return "en";

  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectBrowserLang());

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("club_lang", newLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}