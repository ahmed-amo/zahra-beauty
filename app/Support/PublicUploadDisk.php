<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Disk used for publicly visible shop images (category covers, legacy
 * product images, avatars). Always the Laravel "public" disk — never the
 * private "local" disk.
 */
final class PublicUploadDisk
{
    public static function name(): string
    {
        return 'public';
    }

    public static function store(string $directory, $file): string
    {
        return $file->store($directory, self::name());
    }

    public static function delete(?string $path): void
    {
        $path = self::normalizeStoredPath($path);

        if ($path === null || Str::startsWith($path, ['http://', 'https://', 'catpics/', 'producss/'])) {
            return;
        }

        foreach (array_unique([self::name(), 'public', 'local', config('filesystems.default')]) as $disk) {
            if (! is_string($disk) || $disk === '' || ! config("filesystems.disks.{$disk}")) {
                continue;
            }

            if (Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
        }
    }

    /**
     * Resolve a browser-loadable URL for a stored path. Copies privately
     * stored legacy uploads onto the public disk when found.
     */
    public static function url(?string $path): ?string
    {
        $path = self::normalizeStoredPath($path);

        if ($path === null) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return self::toBrowserUrl($path);
        }

        // Bundled assets under public/ (seed images, legacy product packs).
        if (Str::startsWith($path, ['catpics/', 'producss/'])) {
            return '/'.$path;
        }

        // Path already lives directly under public/ (e.g. logo12.png).
        if (is_file(public_path($path))) {
            return '/'.$path;
        }

        $publicDisk = self::name();

        if (Storage::disk($publicDisk)->exists($path)) {
            return self::toBrowserUrl(Storage::disk($publicDisk)->url($path));
        }

        // Older uploads landed on the private local disk — move them so
        // the storefront can actually load the image.
        foreach (['local', config('filesystems.default')] as $disk) {
            if (! is_string($disk) || $disk === '' || $disk === $publicDisk) {
                continue;
            }

            if (! config("filesystems.disks.{$disk}")) {
                continue;
            }

            if (! Storage::disk($disk)->exists($path)) {
                continue;
            }

            Storage::disk($publicDisk)->put($path, Storage::disk($disk)->get($path));
            Storage::disk($disk)->delete($path);

            return self::toBrowserUrl(Storage::disk($publicDisk)->url($path));
        }

        // Path is recorded but the file is gone — still return the expected
        // public URL so the admin UI can show a broken-image state.
        return self::toBrowserUrl(Storage::disk($publicDisk)->url($path));
    }

    /**
     * Whether the stored path points at a file the web server can serve.
     */
    public static function exists(?string $path): bool
    {
        $path = self::normalizeStoredPath($path);

        if ($path === null) {
            return false;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return true;
        }

        if (is_file(public_path($path))) {
            return true;
        }

        $publicDisk = self::name();

        if (Storage::disk($publicDisk)->exists($path)) {
            return true;
        }

        foreach (['local', config('filesystems.default')] as $disk) {
            if (! is_string($disk) || $disk === '' || $disk === $publicDisk) {
                continue;
            }

            if (config("filesystems.disks.{$disk}") && Storage::disk($disk)->exists($path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Strip accidental /storage prefixes and leading slashes so disk lookups
     * match what $file->store() returns (e.g. "categories/abc.jpg").
     */
    public static function normalizeStoredPath(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        $path = str_replace('\\', '/', trim($path));

        if (Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return $path;
        }

        $path = ltrim($path, '/');

        // asset()/old code sometimes persisted the public URL path.
        if (Str::startsWith($path, 'storage/')) {
            $path = Str::after($path, 'storage/');
        }

        return $path !== '' ? $path : null;
    }

    /**
     * Prefer root-relative URLs for local /storage paths so admin/shop
     * thumbs still load when APP_URL host differs from the browser
     * (localhost vs 127.0.0.1). Keep absolute URLs for external hosts
     * (e.g. OAuth avatar CDNs).
     */
    private static function toBrowserUrl(string $url): string
    {
        if (! Str::startsWith($url, ['http://', 'https://'])) {
            return Str::startsWith($url, '/') ? $url : '/'.$url;
        }

        $path = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);

        // Always rewrite our own public asset paths to root-relative, even
        // when APP_URL host does not match the browser (Railway internal
        // host, http vs https, custom domain, etc.).
        if (is_string($path) && Str::startsWith($path, ['/storage/', '/catpics/', '/producss/'])) {
            return $query ? $path.'?'.$query : $path;
        }

        $host = parse_url($url, PHP_URL_HOST);
        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);

        if (is_string($host) && is_string($appHost) && strcasecmp($host, $appHost) !== 0) {
            return $url;
        }

        return is_string($path) && $path !== ''
            ? ($query ? $path.'?'.$query : $path)
            : $url;
    }
}
