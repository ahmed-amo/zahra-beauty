import ar from "../../lang/ar.json";
import en from "../../lang/en.json";
import fr from "../../lang/fr.json";

export type MessagesMap = Record<string, string>;

const catalogs: Record<string, MessagesMap> = {
    fr: fr as MessagesMap,
    en: en as MessagesMap,
    ar: ar as MessagesMap,
};

/** Bundled locale strings — avoids sending full JSON on every Inertia request. */
export function messagesForLocale(locale: string | undefined): MessagesMap {
    if (locale === "ar") {
        return catalogs.ar;
    }
    if (locale === "en") {
        return catalogs.en;
    }

    return catalogs.fr ?? catalogs.en;
}
