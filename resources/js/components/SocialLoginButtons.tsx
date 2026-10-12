import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.39 13.02 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.08-.41-4.5H24v9h12.7c-.55 2.9-2.23 5.36-4.75 7.01l7.67 5.95C43.88 37.84 46.5 31.68 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.54 28.59A14.47 14.47 0 0 1 9.5 24c0-1.6.28-3.14.8-4.59l-7.98-6.19C.82 16.09 0 19.01 0 22c0 4.99 1.8 9.57 4.81 13.11l7.73-6.52z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.67-5.95C30.39 37.77 27.44 38.5 24 38.5c-6.26 0-11.61-3.52-14.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

interface SocialLoginButtonsProps {
  className?: string;
}

export default function SocialLoginButtons({ className }: SocialLoginButtonsProps) {
  const { t } = useI18n();

  const go = (provider: "google" | "facebook") => {
    window.location.href = route("auth.social", { provider });
  };

  return (
    <div className={cn("grid gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 w-full justify-center gap-3 rounded-2xl border-brand-border bg-white text-brand-text hover:bg-brand-pink-soft"
        onClick={() => go("google")}
      >
        <GoogleIcon />
        <span className="text-sm font-semibold">{t("Continue with Google")}</span>
      </Button>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full justify-center gap-3 rounded-2xl bg-[#1877F2] text-white hover:bg-[#166FE5]"
        onClick={() => go("facebook")}
      >
        <FacebookIcon />
        <span className="text-sm font-semibold">{t("Continue with Facebook")}</span>
      </Button>
    </div>
  );
}
