import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { kk } from './translations';

export type Locale = 'ru' | 'kk';

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({ locale: 'ru', setLocale: () => {} });

const COOKIE = 'locale';

function readLocale(): Locale {
    if (typeof document === 'undefined') return 'ru';
    const match = document.cookie.match(/(?:^|; )locale=(ru|kk)/);
    return (match?.[1] as Locale) ?? 'ru';
}

function persistLocale(locale: Locale): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${COOKIE}=${locale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    document.documentElement.lang = locale;
}

export function LocaleProvider({ children }: PropsWithChildren) {
    const [locale, setLocaleState] = useState<Locale>(() => readLocale());

    const setLocale = useCallback((next: Locale) => {
        persistLocale(next);
        setLocaleState(next);
    }, []);

    const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
    return useContext(LocaleContext);
}

/**
 * Перевод по русской строке-ключу. Русский — по умолчанию; если казахского
 * перевода нет, возвращается исходная русская строка (graceful fallback).
 */
export function useT(): (ru?: string | null) => string {
    const { locale } = useLocale();
    return useCallback(
        (ru?: string | null) => {
            if (!ru) return '';
            return locale === 'kk' ? (kk[ru] ?? ru) : ru;
        },
        [locale],
    );
}

/** Переключатель языка RU / ҚАЗ. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { locale, setLocale } = useLocale();
    return (
        <div className={`inline-flex items-center rounded-lg border border-border p-0.5 text-xs font-semibold ${className}`}>
            {(['ru', 'kk'] as const).map((code) => (
                <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code)}
                    className={`rounded-md px-2 py-1 transition-colors ${
                        locale === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={locale === code}
                >
                    {code === 'ru' ? 'РУ' : 'ҚАЗ'}
                </button>
            ))}
        </div>
    );
}
