import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

/** Apply light/dark from our toggle only (not OS). */
export const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.dataset.theme = appearance;
};

export function initializeTheme() {
    const saved = (localStorage.getItem('appearance') as Appearance | null) === 'dark' ? 'dark' : 'light';
    applyTheme(saved);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        if (typeof window === 'undefined') {
            return 'light';
        }
        return localStorage.getItem('appearance') === 'dark' ? 'dark' : 'light';
    });

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('appearance') === 'dark' ? 'dark' : 'light';
        setAppearance(saved);
        applyTheme(saved);
    }, []);

    return { appearance, updateAppearance, isDark: appearance === 'dark' } as const;
}
