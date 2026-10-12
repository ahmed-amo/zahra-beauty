import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useI18n } from '@/lib/i18n';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { t, direction } = useI18n();
    const isRtl = direction === 'rtl';
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t('Create an account')}
            description={t('Sign up with Google, Facebook, or email')}
        >
            <Head title={t('Sign Up')} />

            <div dir={direction} className="flex flex-col gap-6">
                <SocialLoginButtons />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-brand-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-brand-muted">{t('or email')}</span>
                    </div>
                </div>

                <form className="grid gap-4" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('Full Name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder={t('Your name')}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('Email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder={t('email@example.com')}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('Password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button type="submit" size="lg" className="mt-1 h-12 w-full" disabled={processing}>
                        {processing && (
                            <LoaderCircle className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                        )}
                        {t('Create Account')}
                    </Button>
                </form>

                <p className="text-center text-sm text-brand-muted">
                    {t('Already have an account?')}{' '}
                    <TextLink href={route('login')} className="font-semibold text-primary hover:text-brand-dark">
                        {t('Login')}
                    </TextLink>
                </p>
            </div>
        </AuthLayout>
    );
}
