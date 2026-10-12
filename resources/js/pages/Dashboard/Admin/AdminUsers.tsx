import { FormEvent } from "react";
import { useForm } from "@inertiajs/react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from "../Layouts/admin-layout";
import { useI18n } from "@/lib/i18n";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
  created_at: string | null;
};

export default function AdminUsers({ admins }: { admins: AdminUser[] }) {
  const { t } = useI18n();
  const form = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.processing) return;

    form.post(route("admin.admins.store"), {
      preserveScroll: true,
      onSuccess: () => form.reset("name", "email", "password", "password_confirmation"),
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("Super admin only")}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("Admin accounts")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("Create and manage the team members who can access the admin panel.")}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
          <Users className="h-4 w-4" />
          {admins.length} {admins.length === 1 ? t("admin") : t("admins")}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("Admin team")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{admin.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                </div>
                {admin.is_super_admin ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("Super admin")}
                  </span>
                ) : (
                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {t("Admin")}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {t("Create an admin")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">{t("Name")}</Label>
                <Input
                  id="admin-name"
                  value={form.data.name}
                  onChange={(e) => form.setData("name", e.target.value)}
                  disabled={form.processing}
                  required
                  autoComplete="name"
                />
                {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t("Email")}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={form.data.email}
                  onChange={(e) => form.setData("email", e.target.value)}
                  disabled={form.processing}
                  required
                  autoComplete="email"
                />
                {form.errors.email && <p className="text-xs text-destructive">{form.errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">{t("Password")}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={form.data.password}
                  onChange={(e) => form.setData("password", e.target.value)}
                  disabled={form.processing}
                  required
                  autoComplete="new-password"
                />
                {form.errors.password && <p className="text-xs text-destructive">{form.errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password-confirmation">{t("Confirm password")}</Label>
                <Input
                  id="admin-password-confirmation"
                  type="password"
                  value={form.data.password_confirmation}
                  onChange={(e) => form.setData("password_confirmation", e.target.value)}
                  disabled={form.processing}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={form.processing} className="w-full">
                {form.processing ? t("Creating…") : t("Create admin")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

AdminUsers.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
