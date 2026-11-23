import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings2,
  WalletCards,
} from "lucide-react";
import { DashboardBreadcrumb, DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { signOut } from "@/app/auth/actions";
import { requireAuthContext } from "@/lib/dal/auth";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={17} aria-hidden="true" /> },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: <WalletCards size={17} aria-hidden="true" /> },
  { href: "/dashboard/calendar", label: "Calendar", icon: <CalendarDays size={17} aria-hidden="true" /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={17} aria-hidden="true" /> },
  { href: "/dashboard/history", label: "Payment history", icon: <CreditCard size={17} aria-hidden="true" /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings2 size={17} aria-hidden="true" /> },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAuthContext();

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
  ]);
  const name = profile?.full_name || "My account";
  const initial = (profile?.full_name || user.email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">s</span>subtrack
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <DashboardNavigation items={navigation} />
        <div className="sidebar-bottom">
          <div className="avatar" aria-hidden="true">{initial}</div>
          <div className="profile-name">
            <b>{name}</b>
            <small>{user.email}</small>
          </div>
          <form action={signOut}>
            <button className="logout-button" aria-label="Log out" title="Log out"><LogOut size={16} aria-hidden="true"/></button>
          </form>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar">
          <div>
            <span className="mobile-brand"><span className="brand-mark">s</span>subtrack</span>
            <DashboardBreadcrumb />
          </div>
          <div className="top-actions">
            <Link className="notification-link" href="/dashboard/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
              <Bell size={17} aria-hidden="true" />
              {!!unreadCount && <span className="notification-count" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <Link href="/dashboard/subscriptions#add" className="button button-primary button-small">+ Add subscription</Link>
            <Link href="/dashboard/settings" className="top-avatar" aria-label={`Account settings for ${name}`} title="Account settings"><span aria-hidden="true">{initial}</span></Link>
            <form action={signOut} className="mobile-logout">
              <button className="logout-button" aria-label="Log out" title="Log out"><LogOut size={16} aria-hidden="true"/></button>
            </form>
          </div>
        </header>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </section>
    </div>
  );
}
