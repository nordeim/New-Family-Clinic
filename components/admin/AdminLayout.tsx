// components/admin/AdminLayout.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building,
  BarChart3,
  Settings,
} from "lucide-react";
import React from "react";

const sidebarNavItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Clinics", href: "/admin/clinics", icon: Building },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 flex-col border-r bg-neutral-50 md:flex">
        <nav className="flex flex-col gap-2 p-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-all hover:bg-neutral-200",
                router.pathname.startsWith(item.href) && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-white p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
