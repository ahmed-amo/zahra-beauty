import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import { useI18n } from '@/lib/i18n';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t, direction } = useI18n();
    const page = usePage();
    const queryError = useMemo(() => {
        const raw = page.url.includes('?') ? page.url.split('?')[1] : '';
        return new URLSearchParams(raw).get('error');
    }, [page.url]);
    const isRtl = direction === 'rtl';

    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const oauthMessage = (() => {
        if (!queryError) return null;
        if (queryError === 'google_oauth_missing') return t('auth.google_oauth_missing');
        if (queryError === 'facebook_oauth_missing') return t('auth.facebook_oauth_missing');
        if (queryError === 'oauth_failed') return t('auth.oauth_failed');
        return t('auth.oauth_failed');
    })();

    return (
        <AuthLayout
            title={t('Welcome back')}
            description={t('Sign in with Google, Facebook, or your email')}
        >
            <Head title={t('Login')} />

            {status && (
                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            {oauthMessage && (
                <div
                    className="mb-4 rounded-2xl border border-brand-pink-light bg-brand-pink-soft p-3 text-center text-sm text-brand-text"
                    role="alert"
                >
                    {oauthMessage}
                </div>
            )}

            <div dir={direction} className="flex flex-col gap-6">
                <SocialLoginButtons />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-brand-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-500 dark:text-zinc-400">{t('or email')}</span>
                    </div>
                </div>

                <form className="grid gap-4" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('Email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('email@example.com')}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="password">{t('Password')}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm text-primary hover:text-brand-dark"
                                >
                                    {t('Forgot password?')}
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button type="submit" size="lg" className="mt-1 h-12 w-full" disabled={processing}>
                        {processing && (
                            <LoaderCircle className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                        )}
                        {t('Login')}
                    </Button>
                </form>

                <p className="text-center text-sm text-brand-muted">
                    {t("Don't have an account?")}{' '}
                    <TextLink className="font-semibold text-primary hover:text-brand-dark" href={route('register')}>
                        {t('Sign Up')}
                    </TextLink>
                </p>
            </div>
        </AuthLayout>
    );
}
