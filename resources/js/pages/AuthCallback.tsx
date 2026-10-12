import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "@/contexts/authContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const errorParam = url.searchParams.get("error");

    if (errorParam || !token) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.visit(route("login")), 2500);
      return;
    }

    setToken(token);
    setTimeout(() => router.visit(route("client-dashboard")), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth callback: parse URL once
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-soft">
          <p className="font-semibold text-red-800">Authentication Error</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <p className="mt-4 text-xs text-brand-muted">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-brand-muted">Signing you in…</p>
      </div>
    </div>
  );
}
