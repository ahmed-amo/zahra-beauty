"use client"

import { useId, useRef } from "react"
import { ImagePlus, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

type ImageUploadFieldProps = {
  id?: string
  accept?: string
  multiple?: boolean
  /** Shown when a single image is already selected / stored */
  previewUrl?: string | null
  /** Optional file name under the button */
  fileName?: string | null
  /** For multi-select gallery uploads */
  fileCount?: number
  onChange: (files: FileList | null) => void
  onClear?: () => void
  label?: string
  hint?: string
  error?: string
  className?: string
  /** taller dropzone for cover / hero images */
  size?: "md" | "lg"
}

/**
 * Clean image picker: medium upload icon + outline button.
 * Hides the native “Choose file” control everywhere.
 */
export default function ImageUploadField({
  id,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  multiple = false,
  previewUrl = null,
  fileName = null,
  fileCount = 0,
  onChange,
  onClear,
  label,
  hint,
  error,
  className,
  size = "md",
}: ImageUploadFieldProps) {
  const { t } = useI18n()
  const autoId = useId()
  const inputId = id ?? `upload-${autoId}`
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => inputRef.current?.click()

  const statusText = (() => {
    if (fileCount > 0) {
      return t("upload.files_selected", { count: fileCount })
    }
    if (fileName) return fileName
    return hint ?? t("Drag and drop or click to upload")
  })()

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <p className="text-sm font-medium text-foreground">{label}</p> : null}

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          <img
            src={previewUrl}
            alt=""
            className={cn(
              "w-full object-cover",
              size === "lg" ? "max-h-64 min-h-40" : "h-44",
            )}
          />
          {onClear ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute end-2 top-2 h-8 w-8 shadow-md"
              onClick={onClear}
              aria-label={t("Remove")}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-3 pt-8">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2 bg-white/95 text-zinc-900 hover:bg-white"
              onClick={openPicker}
            >
              <Upload className="h-4 w-4" />
              {t("Replace image")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 text-center transition-colors",
            "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            size === "lg" ? "min-h-44 py-8" : "min-h-36 py-6",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border transition group-hover:ring-primary/30">
            <ImagePlus className="h-6 w-6 text-muted-foreground transition group-hover:text-primary" />
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">{t("Upload image")}</span>
            <span className="block text-xs text-muted-foreground">{statusText}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
            <Upload className="h-4 w-4 text-muted-foreground" />
            {t("Choose File")}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => onChange(e.target.files)}
      />

      {!previewUrl && (fileName || fileCount > 0) ? (
        <p className="truncate text-xs text-muted-foreground">{statusText}</p>
      ) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
