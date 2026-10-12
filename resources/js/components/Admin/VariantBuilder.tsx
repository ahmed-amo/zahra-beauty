import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface VariantAttributeValue {
  id: number
  value: string
  slug: string
  hex_color?: string | null
}

export interface VariantAttribute {
  id: number
  name: string
  slug: string
  is_global?: boolean
  values: VariantAttributeValue[]
}

export interface VariantRow {
  attribute_value_ids: number[]
  barcode?: string | null
  price?: number | null
  compare_at_price?: number | null
  sale_price?: number | null
  stock?: number | null
  weight?: number | null
  is_active?: boolean
  sort_order?: number
  id?: number
  option_label?: string | null
}

interface VariantBuilderProps {
  attributes: VariantAttribute[]
  value: VariantRow[]
  onChange: (rows: VariantRow[]) => void
  basePrice?: number
}

/** Cartesian product of value-id arrays (one array per attribute). */
export function cartesianProduct(arrays: number[][]): number[][] {
  if (arrays.length === 0) return []
  return arrays.reduce<number[][]>(
    (acc, curr) => {
      if (curr.length === 0) return []
      return acc.flatMap((prefix) => curr.map((id) => [...prefix, id]))
    },
    [[]],
  )
}

function sortedIdsKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",")
}

function optionLabelFor(
  valueIds: number[],
  valueLookup: Map<number, VariantAttributeValue>,
): string {
  return valueIds
    .map((id) => valueLookup.get(id)?.value ?? String(id))
    .join(" / ")
}

export default function VariantBuilder({
  attributes,
  value,
  onChange,
  basePrice = 0,
}: VariantBuilderProps) {
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>(() => {
    const fromRows = new Set<number>()
    for (const row of value) {
      for (const attr of attributes) {
        if (row.attribute_value_ids.some((vid) => attr.values.some((v) => v.id === vid))) {
          fromRows.add(attr.id)
        }
      }
    }
    return fromRows.size > 0
      ? attributes.filter((a) => fromRows.has(a.id)).map((a) => a.id)
      : []
  })

  const [selectedValueIds, setSelectedValueIds] = useState<Record<number, number[]>>(() => {
    const initial: Record<number, number[]> = {}
    for (const attr of attributes) {
      const ids = new Set<number>()
      for (const row of value) {
        for (const vid of row.attribute_value_ids) {
          if (attr.values.some((v) => v.id === vid)) ids.add(vid)
        }
      }
      if (ids.size > 0) initial[attr.id] = [...ids]
    }
    return initial
  })

  const valueLookup = useMemo(() => {
    const map = new Map<number, VariantAttributeValue>()
    for (const attr of attributes) {
      for (const v of attr.values) map.set(v.id, v)
    }
    return map
  }, [attributes])

  const selectedAttributes = attributes.filter((a) => selectedAttributeIds.includes(a.id))

  const toggleAttribute = (attrId: number, checked: boolean) => {
    setSelectedAttributeIds((prev) =>
      checked ? [...prev, attrId] : prev.filter((id) => id !== attrId),
    )
    if (!checked) {
      setSelectedValueIds((prev) => {
        const next = { ...prev }
        delete next[attrId]
        return next
      })
    }
  }

  const toggleValue = (attrId: number, valueId: number, checked: boolean) => {
    setSelectedValueIds((prev) => {
      const current = prev[attrId] ?? []
      return {
        ...prev,
        [attrId]: checked
          ? [...current, valueId]
          : current.filter((id) => id !== valueId),
      }
    })
  }

  const generateCombinations = () => {
    const valueArrays = selectedAttributes.map((attr) => selectedValueIds[attr.id] ?? [])
    if (valueArrays.some((arr) => arr.length === 0)) {
      onChange([])
      return
    }

    const combos = cartesianProduct(valueArrays)
    const existingByKey = new Map(value.map((row) => [sortedIdsKey(row.attribute_value_ids), row]))

    const nextRows: VariantRow[] = combos.map((attribute_value_ids, index) => {
      const existing = existingByKey.get(sortedIdsKey(attribute_value_ids))
      if (existing) {
        return {
          ...existing,
          attribute_value_ids,
          sort_order: index,
          option_label: optionLabelFor(attribute_value_ids, valueLookup),
        }
      }
      return {
        attribute_value_ids,
        price: basePrice || null,
        sale_price: null,
        stock: 0,
        weight: null,
        is_active: true,
        sort_order: index,
        option_label: optionLabelFor(attribute_value_ids, valueLookup),
      }
    })

    onChange(nextRows)
  }

  const updateRow = (index: number, patch: Partial<VariantRow>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  if (attributes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Assign attributes to this category first (Admin → Attributes or Category edit).
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">1. Select attributes</p>
          <p className="text-xs text-muted-foreground">Choose which options define your variants.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {attributes.map((attr) => {
            const checked = selectedAttributeIds.includes(attr.id)
            return (
              <label
                key={attr.id}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  checked
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggleAttribute(attr.id, Boolean(v))}
                />
                {attr.name}
              </label>
            )
          })}
        </div>
      </div>

      {/* Step 2 */}
      {selectedAttributes.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">2. Select values</p>
            <p className="text-xs text-muted-foreground">Pick the values to include in combinations.</p>
          </div>
          {selectedAttributes.map((attr) => (
            <div key={attr.id} className="space-y-2">
              <Label className="text-sm font-medium">{attr.name}</Label>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val) => {
                  const checked = (selectedValueIds[attr.id] ?? []).includes(val.id)
                  return (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => toggleValue(attr.id, val.id, !checked)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                    >
                      {val.hex_color ? (
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: val.hex_color }}
                        />
                      ) : null}
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 */}
      {selectedAttributes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">3. Generate combinations</p>
              <p className="text-xs text-muted-foreground">
                Existing price / stock edits are kept when combinations match.
              </p>
            </div>
            <Button type="button" onClick={generateCombinations}>
              Generate combinations
            </Button>
          </div>

          {value.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No variants yet. Select values and generate combinations.
            </p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="w-20 text-center">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {value.map((row, index) => {
                    const label =
                      row.option_label ||
                      optionLabelFor(row.attribute_value_ids, valueLookup)
                    return (
                      <TableRow key={sortedIdsKey(row.attribute_value_ids) || index}>
                        <TableCell className="max-w-[10rem] font-medium">{label}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={row.price ?? ""}
                            onChange={(e) =>
                              updateRow(index, {
                                price: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="h-8 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={row.sale_price ?? ""}
                            onChange={(e) =>
                              updateRow(index, {
                                sale_price: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="h-8 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={row.stock ?? 0}
                            onChange={(e) =>
                              updateRow(index, { stock: Number(e.target.value) || 0 })
                            }
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.weight ?? ""}
                            onChange={(e) =>
                              updateRow(index, {
                                weight: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={row.is_active !== false}
                            onCheckedChange={(v) => updateRow(index, { is_active: Boolean(v) })}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
