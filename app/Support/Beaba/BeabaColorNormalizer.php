<?php

namespace App\Support\Beaba;

final class BeabaColorNormalizer
{
    /**
     * Explicit BEABA color tokens (longest match wins). Unlisted suffixes stay ungrouped.
     *
     * @var list<string>
     */
    private const COLORS = [
        'Duo Barbe à papa / Guimauve',
        'Duo Argile / Vert de gris',
        'Duo Galet / Bleu nuage',
        'terracotta/velvet grey',
        'sage green/velvet grey',
        'Barbe à papa/Guimauve',
        'Vert sauge/Vert de gris',
        'Mineral grey/blue',
        'Mineral grey/pink',
        'Argile Translucide',
        'Galet Translucide',
        'Minéral/Terracotta',
        'Terracotta/Gazelle',
        'Terracotta/Clay',
        'Argile/Gazelle',
        'Misty/Mineral',
        'Pralin/Argile',
        'Jaune/Vert',
        'Grey/white',
        'Night Blue',
        'Night blue',
        'Night blue EU',
        'Gris Anthracite',
        'Gris mineral',
        'Gris Mineral',
        'Gris Velours',
        'Gris velours',
        'Bleu baltique',
        'Baltic Blue',
        'Sage Green',
        'Sage green',
        'Vert de gris',
        'Vert sauge',
        'Vert d\'eau',
        'Barbe à papa',
        'Vieux rose',
        'Old Pink',
        'old pink',
        'Dusty Rose',
        'Heather grey',
        'Misty green',
        'Light Mist',
        'Savannah bloom',
        'Natural set',
        'Green Blue',
        'windy blue',
        'velvet grey',
        'dark grey',
        'light blue',
        'bleu marine',
        'Duo argile',
        'Duo barbe à papa',
        'Duo nature',
        'Argile EU',
        'Terre d\'argile',
        'Lin naturel',
        'Yellow Palm tree',
        'Big Love',
        'BigLove',
        'Biglove',
        'Eucalyptus',
        'Terracotta',
        'Adventure',
        'Guimauve',
        'Playful',
        'Natural',
        'naturel',
        'Mineral',
        'Argile',
        'argile',
        'Galet',
        'Cacao',
        'Pralin',
        'Jungle',
        'Teddy',
        'CYGNE',
        'Kaki',
        'White',
        'white',
        'Grey',
        'grey',
        'blue',
        'pink',
        'Zen Clear',
        'Léopard',
    ];

    /**
     * @return array{base_name: string, color: ?string, confidence: string}
     */
    public function parse(string $designation): array
    {
        $name = preg_replace('/\s+/u', ' ', trim($designation)) ?? trim($designation);

        if ($name === '') {
            return ['base_name' => '', 'color' => null, 'confidence' => 'empty'];
        }

        $colors = self::COLORS;
        usort($colors, fn (string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));

        $dash = $this->extractDashColor($name, $colors);
        if ($dash !== null) {
            return $dash;
        }

        $tail = $this->extractTrailingColor($name, $colors);
        if ($tail !== null) {
            return $tail;
        }

        return [
            'base_name' => $name,
            'color' => null,
            'confidence' => 'uncertain',
        ];
    }

    public function normalizeKey(string $value): string
    {
        if (class_exists(\Normalizer::class)) {
            $value = \Normalizer::normalize($value, \Normalizer::FORM_D) ?: $value;
        }

        $value = preg_replace('/\p{M}/u', '', $value) ?? $value;
        $value = str_replace(['®', '™'], '', $value);
        $value = mb_strtolower($value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim($value);
    }

    /**
     * @param  list<string>  $colors
     * @return array{base_name: string, color: string, confidence: string}|null
     */
    private function extractDashColor(string $name, array $colors): ?array
    {
        $pos = mb_strrpos($name, ' - ');
        if ($pos === false) {
            return null;
        }

        $base = trim(mb_substr($name, 0, $pos));
        $color = trim(mb_substr($name, $pos + 3));

        if ($base === '' || $color === '') {
            return null;
        }

        foreach ($colors as $known) {
            if ($this->normalizeKey($known) === $this->normalizeKey($color)) {
                return [
                    'base_name' => $base,
                    'color' => $color,
                    'confidence' => 'dash',
                ];
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $colors
     * @return array{base_name: string, color: string, confidence: string}|null
     */
    private function extractTrailingColor(string $name, array $colors): ?array
    {
        $normalizedName = $this->normalizeKey($name);

        foreach ($colors as $known) {
            $knownKey = $this->normalizeKey($known);
            $suffixes = [' '.$knownKey, '-'.$knownKey, ' -'.$knownKey];

            foreach ($suffixes as $suffix) {
                if (! str_ends_with($normalizedName, $suffix)) {
                    continue;
                }

                $pattern = '/[\s-]+'.preg_quote($known, '/').'\s*$/iu';
                $base = trim(preg_replace($pattern, '', $name) ?? $name);
                $base = rtrim($base, " \t-");

                if (mb_strlen($base) < 3) {
                    continue;
                }

                return [
                    'base_name' => $base,
                    'color' => $known,
                    'confidence' => 'trailing',
                ];
            }
        }

        return null;
    }
}
