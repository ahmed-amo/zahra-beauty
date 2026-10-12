/**
 * Resolve a path or URL from the backend into a browser-loadable src.
 * Always returns a root-relative path for local files so thumbs work when
 * APP_URL (localhost) differs from the address bar (127.0.0.1).
 */
export function mediaUrl(
  pathOrUrl?: string | null,
  fallback: string | null = "/placeholder.jpg",
): string | null {
  if (!pathOrUrl || !pathOrUrl.trim()) {
    return fallback
  }

  const raw = pathOrUrl.trim().replace(/\\/g, "/")

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const parsed = new URL(raw)
        // Same-origin absolute URLs → path only (avoids localhost vs 127.0.0.1).
        if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
          return parsed.pathname + parsed.search
        }
        // Cross-host but clearly our storage/public assets → use path only.
        if (
          parsed.pathname.startsWith("/storage/") ||
          parsed.pathname.startsWith("/catpics/") ||
          parsed.pathname.startsWith("/producss/")
        ) {
          return parsed.pathname + parsed.search
        }
      }
    } catch {
      // fall through
    }
    return raw
  }

  const path = raw.replace(/^\/+/, "")

  if (path.startsWith("catpics/") || path.startsWith("producss/")) {
    return `/${path}`
  }

  if (path.startsWith("storage/")) {
    return `/${path}`
  }

  // Already a site-root path like /logo12.png
  if (raw.startsWith("/")) {
    return raw
  }

  return `/storage/${path}`
}

export function categoryImageSrc(category: {
  image_url?: string | null
  image?: string | null
}): string | null {
  return mediaUrl(category.image_url || category.image || null)
}
