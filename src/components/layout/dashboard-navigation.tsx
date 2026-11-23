"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: ReactNode };

export function DashboardNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation">
      {items.map(({ href, label, icon }) => {
        const active = href === "/dashboard"
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            href={href}
            className={`side-link${active ? " side-link-active" : ""}`}
            aria-current={active ? "page" : undefined}
            key={href}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/subscriptions": "Subscriptions",
  "/dashboard/calendar": "Calendar",
  "/dashboard/analytics": "Analytics",
  "/dashboard/history": "Payment history",
  "/dashboard/settings": "Settings",
  "/dashboard/notifications": "Notifications",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const basePath = pathname.startsWith("/dashboard/subscriptions/")
    ? "/dashboard/subscriptions"
    : pathname;
  const title = routeTitles[basePath] ?? "Workspace";

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><Link href="/dashboard">Workspace</Link></li>
        <li aria-hidden="true"><span>/</span></li>
        <li aria-current="page">{title}</li>
      </ol>
    </nav>
  );
}
