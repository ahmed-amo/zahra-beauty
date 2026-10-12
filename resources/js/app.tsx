import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Zahra';

// The glob below is used as a fallback to resolve page components. It has proven unreliable
// during Docker builds, so critical pages are also imported explicitly to guarantee they are
// always bundled and available to Inertia at runtime.
const pageModules = import.meta.glob('./pages/**/*.tsx') as Record<string, () => Promise<unknown>>;

const explicitPageModules: Record<string, () => Promise<unknown>> = {
    './pages/home.tsx': () => import('./pages/home'),
    './pages/ProductsCatalog.tsx': () => import('./pages/ProductsCatalog'),
};

const allPageModules = { ...pageModules, ...explicitPageModules };

function resolveShopPage(name: string) {
    const key = String(name).trim();
    return resolvePageComponent(`./pages/${key}.tsx`, allPageModules);
}

function applyLocaleToDocument(props: { locale?: string; direction?: 'ltr' | 'rtl' }) {
    const locale = props.locale ?? 'fr';
    const direction = props.direction ?? 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.classList.toggle('font-arabic', locale === 'ar');
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolveShopPage(name),
    setup({ el, App, props }) {
        const root = createRoot(el);
        applyLocaleToDocument(props.initialPage.props as { locale?: string; direction?: 'ltr' | 'rtl' });
        router.on('navigate', (event) => {
            applyLocaleToDocument(event.detail.page.props as { locale?: string; direction?: 'ltr' | 'rtl' });
        });

        root.render(
            <ErrorBoundary fallbackTitle="The app failed to load. Please refresh the page.">
                <AuthProvider>
                    <App {...props} />
                </AuthProvider>
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
