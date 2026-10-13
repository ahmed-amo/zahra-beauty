import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function resolveAppearance(): Appearance {
    const stored = localStorage.getItem('appearance');
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply light/dark. A saved choice wins; otherwise the OS preference is used. */
export const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.dataset.theme = appearance;
};

export function initializeTheme() {
    applyTheme(resolveAppearance());
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        if (typeof window === 'undefined') {
            return 'light';
        }
        return resolveAppearance();
    });

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
    }, []);

    useEffect(() => {
        const saved = resolveAppearance();
        setAppearance(saved);
        applyTheme(saved);
    }, []);

    return { appearance, updateAppearance, isDark: appearance === 'dark' } as const;
}
