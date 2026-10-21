import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type UiLanguage = 'en' | 'fr';
export type ProfileLanguage = UiLanguage | 'rw';

type LanguageValue = {
  language: UiLanguage;
  profileLanguage: ProfileLanguage;
  setLanguage: (language: ProfileLanguage) => void;
  tx: (en: string, fr: string) => string;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [profileLanguage, setProfileLanguage] = useState<ProfileLanguage>('en');
  const language: UiLanguage = profileLanguage === 'rw' ? 'en' : profileLanguage;
  const value = useMemo<LanguageValue>(
    () => ({
      language,
      profileLanguage,
      setLanguage: setProfileLanguage,
      tx: (en, fr) => (language === 'fr' ? fr : en),
    }),
    [language, profileLanguage],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTx() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useTx must be used within LanguageProvider');
  }
  return value;
}
