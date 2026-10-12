<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class AlgeriaLocations
{
    /**
     * @return list<array{code: string, number: int, name_fr: string, name_ar: string, name_en: string}>
     */
    public function wilayas(): array
    {
        return Cache::remember('algeria.wilayas.v1', 86400 * 30, function () {
            $raw = $this->readJson('wilayas.json');
            $rows = $raw['wilayas'] ?? $raw;

            $wilayas = [];
            foreach ($rows as $row) {
                $code = str_pad((string) ($row['code'] ?? $row['wilaya_num'] ?? ''), 2, '0', STR_PAD_LEFT);
                $wilayas[] = [
                    'code' => $code,
                    'number' => (int) ($row['wilaya_num'] ?? (int) $code),
                    'name_fr' => (string) ($row['nom_fr'] ?? ''),
                    'name_ar' => (string) ($row['nom_ar'] ?? ''),
                    'name_en' => (string) ($row['nom_en'] ?? $row['nom_fr'] ?? ''),
                ];
            }

            usort($wilayas, fn ($a, $b) => $a['number'] <=> $b['number']);

            return $wilayas;
        });
    }

    /**
     * @return list<array{name_fr: string, name_ar: string, name_en: string, postal_code: ?string}>
     */
    public function communesForWilaya(string $wilayaCode): array
    {
        $code = str_pad($wilayaCode, 2, '0', STR_PAD_LEFT);

        return Cache::remember("algeria.communes.{$code}.v1", 86400 * 30, function () use ($code) {
            $raw = $this->readJson('communes.json');
            $rows = $raw['communes'] ?? $raw;
            $communes = [];

            foreach ($rows as $row) {
                $wilaya = str_pad((string) ($row['wilaya_code'] ?? $row['wilaya_num'] ?? ''), 2, '0', STR_PAD_LEFT);
                if ($wilaya !== $code) {
                    continue;
                }

                $communes[] = [
                    'name_fr' => (string) ($row['nom_fr'] ?? ''),
                    'name_ar' => (string) ($row['nom_ar'] ?? ''),
                    'name_en' => (string) ($row['nom_en'] ?? $row['nom_fr'] ?? ''),
                    'postal_code' => isset($row['code_postal']) && $row['code_postal'] !== null
                        ? (string) $row['code_postal']
                        : null,
                ];
            }

            usort($communes, fn ($a, $b) => strcmp($a['name_fr'], $b['name_fr']));

            return $communes;
        });
    }

    public function wilayaName(string $wilayaCode, string $locale = 'fr'): ?string
    {
        $code = str_pad($wilayaCode, 2, '0', STR_PAD_LEFT);
        foreach ($this->wilayas() as $wilaya) {
            if ($wilaya['code'] !== $code) {
                continue;
            }

            return match ($locale) {
                'ar' => $wilaya['name_ar'],
                'en' => $wilaya['name_en'],
                default => $wilaya['name_fr'],
            };
        }

        return null;
    }

    public function communeExists(string $wilayaCode, string $communeName): bool
    {
        $needle = mb_strtolower(trim($communeName));
        foreach ($this->communesForWilaya($wilayaCode) as $commune) {
            foreach (['name_fr', 'name_ar', 'name_en'] as $key) {
                if (mb_strtolower($commune[$key]) === $needle) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    private function readJson(string $filename): array
    {
        $path = database_path('data/algeria/'.$filename);
        if (! is_file($path)) {
            throw new RuntimeException("Algeria dataset missing: {$filename}");
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (! is_array($decoded)) {
            throw new RuntimeException("Invalid Algeria dataset: {$filename}");
        }

        return $decoded;
    }
}
