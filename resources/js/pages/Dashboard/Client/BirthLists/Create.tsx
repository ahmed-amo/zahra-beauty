import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUploadField from "@/components/Admin/ImageUploadField";
import ClientLayout from "../../Layouts/client-layout";
import { useI18n } from "@/lib/i18n";

const fieldClass =
  "h-11 rounded-xl border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function BirthListCreate() {
  const { t } = useI18n();
  const page = usePage<{ errors?: Record<string, string> }>();
  const serverErrors = page.props.errors ?? {};
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    baby_first_name: "",
    show_donor_names: true,
  });
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cover) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(cover);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const nameError = serverErrors.name;
  const coverServerError = serverErrors.cover_image;

  const coverHint = useMemo(
    () => t("JPG, PNG, WEBP or GIF — max 5 MB"),
    [t],
  );

  const onCoverChange = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setCoverError(null);
    if (!file) {
      setCover(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      setCover(null);
      setCoverError(t("Please choose a JPG, PNG, WEBP or GIF image."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCover(null);
      setCoverError(t("Image must be 5 MB or smaller."));
      return;
    }
    setCover(file);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (coverError) return;

    setPending(true);
    const data = new FormData();
    data.append("name", form.name);
    if (form.baby_first_name) data.append("baby_first_name", form.baby_first_name);
    data.append("show_donor_names", form.show_donor_names ? "1" : "0");
    if (cover) data.append("cover_image", cover);

    router.post(route("client.birth-lists.store"), data, {
      forceFormData: true,
      onFinish: () => setPending(false),
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 text-zinc-900 dark:text-zinc-100">
      <Link
        href={route("client.birth-lists.index")}
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("Back")}
      </Link>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{t("Create birth list")}</h1>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-800 dark:text-zinc-200">
            {t("List name")}
          </Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("e.g. Leo's birth list")}
            className={fieldClass}
          />
          {nameError && <p className="text-xs text-red-600">{nameError}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="baby_first_name" className="text-zinc-800 dark:text-zinc-200">
            {t("Baby first name")} ({t("optional")})
          </Label>
          <Input
            id="baby_first_name"
            value={form.baby_first_name}
            onChange={(e) => setForm({ ...form, baby_first_name: e.target.value })}
            className={fieldClass}
          />
        </div>

        <ImageUploadField
          label={`${t("Cover photo")} (${t("optional")})`}
          hint={coverHint}
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          previewUrl={previewUrl}
          fileName={cover?.name ?? null}
          error={coverError ?? coverServerError ?? undefined}
          onChange={onCoverChange}
          onClear={() => {
            setCover(null);
            setCoverError(null);
          }}
          size="lg"
        />

        <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <Checkbox
            checked={form.show_donor_names}
            onCheckedChange={(v) => setForm({ ...form, show_donor_names: Boolean(v) })}
          />
          {t("Show donor names to guests")}
        </label>

        {serverErrors && Object.keys(serverErrors).length > 0 && !coverServerError && !nameError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {Object.values(serverErrors)[0]}
          </p>
        )}

        <Button type="submit" disabled={pending || Boolean(coverError)} className="w-full rounded-xl">
          {pending ? t("Saving…") : t("Create birth list")}
        </Button>
      </form>
    </div>
  );
}

BirthListCreate.layout = (page: React.ReactNode) => <ClientLayout>{page}</ClientLayout>;
