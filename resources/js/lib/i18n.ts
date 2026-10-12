import { useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { formatDA } from "@/lib/currency";
import { messagesForLocale, type MessagesMap } from "@/lib/lang-catalog";

/** Localize Laravel pagination link HTML (Previous / Next). */
export function localizePaginationLabelHtml(html: string, locale: string): string {
  if (locale === "ar") {
    return html
      .replace(/&laquo;\s*Previous\s*/gi, "السابق ")
      .replace(/Next\s*&raquo;/gi, "التالي ")
      .replace(/\bPrevious\b/gi, "السابق")
      .replace(/\bNext\b/gi, "التالي");
  }
  if (locale === "fr") {
    return html
      .replace(/&laquo;\s*Previous\s*/gi, "Précédent ")
      .replace(/Next\s*&raquo;/gi, "Suivant ")
      .replace(/\bPrevious\b/gi, "Précédent")
      .replace(/\bNext\b/gi, "Suivant");
  }
  return html;
}

export function useI18n() {
  const props = usePage().props as {
    locale?: string;
    direction?: "rtl" | "ltr";
  };

  const locale = props.locale ?? "fr";
  const messages: MessagesMap = messagesForLocale(locale);

  /** Looks up a key, then fills Laravel-style `:token` placeholders. */
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const message = messages[key] ?? key;

    if (!replacements) {
      return message;
    }

    return Object.entries(replacements).reduce(
      (result, [token, value]) => result.replaceAll(`:${token}`, String(value)),
      message,
    );
  };

  const formatPrice = useCallback(
    (value: number | string | null | undefined) => formatDA(value, locale),
    [locale],
  );

  return {
    t,
    locale,
    direction: props.direction ?? "ltr",
    formatPrice,
  };
}
