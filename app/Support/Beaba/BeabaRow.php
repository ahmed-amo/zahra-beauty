<?php

namespace App\Support\Beaba;

final class BeabaRow
{
    public function __construct(
        public readonly int $rowNumber,
        public readonly ?string $statut,
        public readonly ?string $availability,
        public readonly ?string $alternative,
        public readonly string $categoryRaw,
        public readonly string $categoryFr,
        public readonly ?string $categoryEn,
        public readonly string $ean,
        public readonly string $reference,
        public readonly string $designation,
        public readonly float $priceDa,
        public readonly string $baseName,
        public readonly ?string $color,
        public readonly string $colorConfidence,
    ) {}

    public function isInactiveStatus(): bool
    {
        $statut = mb_strtolower(trim((string) $this->statut));

        return in_array($statut, ['stop', 'exclu retail', 'onliners'], true);
    }

    public function parentKey(): string
    {
        $normalizer = new BeabaColorNormalizer;
        $base = $normalizer->normalizeKey($this->baseName);
        $cat = $normalizer->normalizeKey($this->categoryFr);

        return 'beaba:'.$cat.':'.$base;
    }
}
