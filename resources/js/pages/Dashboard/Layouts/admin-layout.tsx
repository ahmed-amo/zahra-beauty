import type React from "react"
import { Home, Package, FolderTree, ShoppingCart, Users, BarChart3, Bell, LogOut, User as UserIcon, Menu, Tag, Shapes, Sparkles, ShieldCheck } from "lucide-react"
import DarkModeToggle from "@/components/darkmode"
import { Link, router, usePage } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { PageProps } from "@/types"
import { getAvatarUrl } from "@/lib/avatar"
import { useState } from "react"
import { useI18n } from "@/lib/i18n"
import LanguageSwitcher from "@/components/language-switcher"
import AdminGlobalSearch from "@/components/Admin/AdminGlobalSearch"

const handleLogout = () => {
  router.post(route('logout'))
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { url, props } = usePage<PageProps>()
  const { t, direction } = useI18n()
  const isRtl = direction === "rtl"
  const user = props.auth.user
  const adminNotifications = props.adminNotifications as { unreadCount: number; items: Array<{ id: string; data: Record<string, unknown> }> } | null | undefined
  const avatarUrl = getAvatarUrl(user?.picture ?? user?.avatar)
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"
  const displayName = user?.name ?? "Admin User"
  const displayEmail = user?.email ?? "admin@store.com"
  const isSuperAdmin = Boolean(user?.is_super_admin)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigation = [
    { name: t("Dashboard"), href: "/admin/dashboard", icon: BarChart3 },
    { name: t("Categories"), href: "/admin/categories", icon: FolderTree },
    { name: t("Attributes"), href: "/admin/attributes", icon: Shapes },
    { name: t("Products"), href: "/admin/products", icon: Package },
    { name: t("Sale pricing"), href: "/admin/sales", icon: Tag },
    { name: t("Hero"), href: "/admin/hero", icon: Sparkles },
    { name: t("Orders"), href: "/admin/customer-orders", icon: ShoppingCart },
    { name: t("Customers"), href: "/admin/customers", icon: Users },
    ...(isSuperAdmin ? [{ name: t("Admins"), href: "/admin/admins", icon: ShieldCheck }] : []),
  ]

  return (
    <div dir={direction} className="dashboard-theme relative flex h-screen overflow-hidden bg-background text-foreground">
      {/* Accents only in dark mode — light stays clean white */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 blur-3xl" />
        <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-gradient-to-tr from-secondary/10 to-primary/10 blur-3xl" />
      </div>

      {/* Modern Sidebar - Hidden on mobile */}
      <aside className={`hidden lg:flex z-10 w-72 flex-col border-border bg-card shadow-xl ${isRtl ? "border-l" : "border-r"}`}>
        {/* Logo Section */}
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("Admin Panel")}</h1>
              <p className="text-xs text-muted-foreground">{t("Management Dashboard")}</p>
            </div>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="border-b border-border bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-brand-gradient px-3 py-1">
              <p className="text-xs font-bold text-white">{t("ADMINISTRATOR")}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("Full system access")}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = url === item.href || url.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card at Bottom */}
        <div className="border-t border-border bg-muted/40 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
            <Avatar className="h-10 w-10 ring-2 ring-primary">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-brand-gradient text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="z-10 flex flex-1 flex-col overflow-hidden bg-background">
        {/* Professional Top Navbar */}
        <header className={`flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-6 ${isRtl ? "flex-row-reverse" : ""}`}>
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="w-72 bg-card p-0 text-foreground">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-lg">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{t("Admin Panel")}</h1>
                    <p className="text-xs text-muted-foreground">{t("Management Dashboard")}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="border-b border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-brand-gradient px-3 py-1">
                    <p className="text-xs font-bold text-white">{t("ADMINISTRATOR")}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t("Full system access")}</p>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {navigation.map((item) => {
                  const isActive = url === item.href || url.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-border bg-muted/40 p-4">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
                  <Avatar className="h-10 w-10 ring-2 ring-primary">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-brand-gradient text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Search Bar - Hidden on mobile */}
          <div className={`hidden md:flex flex-1 max-w-md ${isRtl ? "justify-end" : ""}`}>
            <AdminGlobalSearch isRtl={isRtl} />
          </div>

          {/* Right Side Actions */}
          <div className={`flex items-center gap-2 md:gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            {/* Home Button */}
            <Link href={route('home')}>
              <Button variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Home")}</span>
              </Button>
            </Link>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            <LanguageSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                >
                  <Bell className="h-5 w-5" />
                  {(adminNotifications?.unreadCount ?? 0) > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>{t("Notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminNotifications?.items?.length ? (
                  <>
                    {adminNotifications.items.map((notification) => (
                      <DropdownMenuItem key={notification.id} asChild>
                        <Link href="/admin/customer-orders" className="flex flex-col items-start">
                          <span className="font-medium">{t("New order received")}</span>
                          <span className="text-xs text-gray-500">
                            {String(notification.data.order_number ?? "")}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.post(route("admin.notifications.readAll"))}>
                      {t("Mark all as read")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem disabled>{t("No new notifications")}</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0 ring-2 ring-border hover:ring-primary">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-brand-gradient text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64 border-border bg-popover p-2 text-popover-foreground" align="end">
                <DropdownMenuLabel className="pb-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
                    <div className="mt-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-primary">
                        {t("Administrator")}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                        <span className="font-medium">{t("Dashboard")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/client/profile"
                    className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md"
                  >
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                        <span className="font-medium">{t("Profile")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                >
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-medium">{t("Logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content with Professional Styling */}
        <main className="flex-1 overflow-y-auto bg-background text-foreground">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
