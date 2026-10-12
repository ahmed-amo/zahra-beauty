<?php

namespace App\Support\Beaba;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReader;
use PhpOffice\PhpSpreadsheet\Settings;
use RuntimeException;

final class BeabaWorkbook
{
    public function __construct(
        private readonly BeabaColorNormalizer $colors = new BeabaColorNormalizer,
    ) {}

    /**
     * @return list<BeabaRow>
     */
    public function read(string $path): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("BEABA workbook not found: {$path}");
        }

        $previousLimit = ini_get('memory_limit');
        if ($this->memoryLimitBytes($previousLimit) < 512 * 1024 * 1024) {
            ini_set('memory_limit', '512M');
        }

        // Avoid Maatwebsite's unbounded in-memory cell cache for large workbooks.
        Settings::setCache(new \Maatwebsite\Excel\Cache\MemoryCache(100));

        try {
            $reader = IOFactory::createReaderForFile($path);
            $reader->setReadDataOnly(true);
            if (method_exists($reader, 'setReadEmptyCells')) {
                $reader->setReadEmptyCells(false);
            }
            /** @var IReader $reader */
            $spreadsheet = $reader->load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $matrix = $sheet->toArray(null, true, false, false);
            $spreadsheet->disconnectWorksheets();
            unset($spreadsheet);
        } finally {
            if (is_string($previousLimit) && $previousLimit !== '') {
                ini_set('memory_limit', $previousLimit);
            }
        }

        $headerIndex = null;
        foreach ($matrix as $index => $row) {
            $cells = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $row);
            if (in_array('Statut', $cells, true) && in_array('ean13', $cells, true)) {
                $headerIndex = $index;
                break;
            }
        }

        if ($headerIndex === null) {
            throw new RuntimeException('Could not locate BEABA header row (Statut / ean13).');
        }

        $header = array_map(
            fn ($v) => is_string($v) ? trim($v) : (string) $v,
            $matrix[$headerIndex],
        );

        $map = [
            'statut' => $this->columnIndex($header, 'Statut'),
            'availability' => $this->columnIndex($header, 'Availability'),
            'alternative' => $this->columnIndex($header, 'Alternative'),
            'category' => $this->columnIndex($header, 'Category'),
            'ean' => $this->columnIndex($header, 'ean13'),
            'reference' => $this->columnIndex($header, 'Référence', 'Reference'),
            'designation' => $this->columnIndex($header, 'Designation FR', 'Designation'),
            'price' => $this->columnIndex($header, 'Prix Web Site', 'Prix'),
        ];

        $rows = [];

        for ($i = $headerIndex + 1; $i < count($matrix); $i++) {
            $raw = $matrix[$i];
            if (! is_array($raw) || ! $this->rowHasData($raw)) {
                continue;
            }

            $designation = $this->stringCell($raw, $map['designation']);
            $ean = $this->eanCell($raw, $map['ean']);
            $reference = $this->stringCell($raw, $map['reference']);
            $price = $this->priceCell($raw, $map['price']);

            if ($designation === '' && $ean === '' && $reference === '') {
                continue;
            }

            $categoryRaw = $this->stringCell($raw, $map['category'], preserveNewlines: true);
            [$categoryFr, $categoryEn] = $this->splitCategory($categoryRaw);
            $parsed = $this->colors->parse($designation);

            $rows[] = new BeabaRow(
                rowNumber: $i + 1,
                statut: $this->nullableString($raw, $map['statut']),
                availability: $this->nullableString($raw, $map['availability']),
                alternative: $this->nullableString($raw, $map['alternative']),
                categoryRaw: $categoryRaw,
                categoryFr: $categoryFr !== '' ? $categoryFr : 'BEABA',
                categoryEn: $categoryEn,
                ean: $ean,
                reference: $reference,
                designation: $designation,
                priceDa: $price,
                baseName: $parsed['base_name'],
                color: $parsed['color'],
                colorConfidence: $parsed['confidence'],
            );
        }

        return $rows;
    }

    /**
     * @param  list<string>  $header
     */
    private function columnIndex(array $header, string ...$names): int
    {
        foreach ($names as $name) {
            $idx = array_search($name, $header, true);
            if ($idx !== false) {
                return (int) $idx;
            }
        }

        throw new RuntimeException('Missing column: '.implode(' / ', $names));
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function rowHasData(array $row): bool
    {
        foreach ($row as $value) {
            if ($value === null) {
                continue;
            }
            if (is_string($value) && trim($value) === '') {
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function stringCell(array $row, int $index, bool $preserveNewlines = false): string
    {
        $value = $row[$index] ?? null;
        if ($value === null) {
            return '';
        }

        $text = (string) $value;
        if ($preserveNewlines) {
            $text = preg_replace("/[^\S\r\n]+/u", ' ', $text) ?? $text;
            $text = preg_replace("/\r\n|\r|\n/u", "\n", $text) ?? $text;

            return trim($text);
        }

        return trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function nullableString(array $row, int $index): ?string
    {
        $value = $this->stringCell($row, $index);

        return $value === '' ? null : $value;
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function eanCell(array $row, int $index): string
    {
        $value = $row[$index] ?? null;
        if ($value === null || $value === '') {
            return '';
        }

        if (is_float($value) || is_int($value)) {
            return (string) (int) $value;
        }

        $raw = trim((string) $value);
        if (is_numeric($raw)) {
            return (string) (int) $raw;
        }

        return preg_replace('/\D+/', '', $raw) ?? $raw;
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function priceCell(array $row, int $index): float
    {
        $value = $row[$index] ?? null;
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        $cleaned = preg_replace('/[^\d.,-]/', '', (string) $value) ?? '0';
        $cleaned = str_replace(',', '.', $cleaned);

        return (float) $cleaned;
    }

    /**
     * @return array{0: string, 1: ?string}
     */
    private function splitCategory(string $raw): array
    {
        $parts = preg_split('/\r\n|\n|\r/', $raw) ?: [];
        $parts = array_values(array_filter(array_map('trim', $parts), fn ($p) => $p !== ''));

        if (count($parts) >= 2) {
            return [$parts[0], $parts[1]];
        }

        // Some XLSX readers flatten the bilingual label onto one line.
        foreach (['BABY BOTTLES', 'MEALTIME', 'OUTINGS', 'HOME'] as $en) {
            if (preg_match('/^(.+?)\s+'.preg_quote($en, '/').'$/iu', trim($raw), $matches)) {
                return [trim($matches[1]), $en];
            }
        }

        if ($parts === []) {
            return ['', null];
        }

        return [$parts[0], null];
    }

    private function memoryLimitBytes(false|string $limit): int
    {
        if ($limit === false || $limit === '' || $limit === '-1') {
            return PHP_INT_MAX;
        }

        $unit = strtolower(substr($limit, -1));
        $value = (int) $limit;

        return match ($unit) {
            'g' => $value * 1024 * 1024 * 1024,
            'm' => $value * 1024 * 1024,
            'k' => $value * 1024,
            default => (int) $limit,
        };
    }
}
