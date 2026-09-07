"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { api, getSession, setSession, type User } from "@/lib/api";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";

const links = [
  ["/dashboard", "⌂", "Overview"],
  ["/dashboard/chat", "✦", "Style with Clo"],
  ["/dashboard/wardrobe", "◇", "My wardrobe"],
  ["/dashboard/try-ons", "◎", "Try-ons"],
  ["/dashboard/subscription", "◈", "Plan & billing"],
  ["/dashboard/profile", "○", "Style profile"],
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    const session = getSession();
    if (!session?.access_token) router.replace("/login");
    else setUser(session.user);
  }, [router]);
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const session = getSession();
    try {
      if (session?.refresh_token)
        await api("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
    } catch {
    } finally {
      setSession(null);
      router.replace("/login");
    }
  }
  if (!user)
    return (
      <div className="appLoading">
        <span>✦</span>
        <p>Opening your wardrobe…</p>
      </div>
    );

  return (
    <div className={`dashboardShell ${collapsed ? "navCollapsed" : ""}`}>
      <aside className={`dashboardNav ${open ? "open" : ""}`}>
        <div className="dashBrand">
          <Brand compact />
          <button
            className="desktopCollapse"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d={collapsed ? "m7 4 6 6-6 6" : "m13 4-6 6 6 6"} />
            </svg>
          </button>
          <button className="mobileClose" onClick={() => setOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav>
          {links.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={() => setOpen(false)}
              className={path === href ? "active" : ""}
            >
              <i>{icon}</i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="trialCard">
          <span>Free trial</span>
          <strong>Make your first look real</strong>
          <p>Your plan includes two visual try-ons.</p>
          <Link href="/dashboard/subscription">View plan →</Link>
        </div>
        <div className="dashUser">
          <span>
            {user.first_name[0]}
            {user.last_name[0]}
          </span>
          <div>
            <strong>
              {user.first_name} {user.last_name}
            </strong>
            <small>{user.email}</small>
          </div>
          <button
            className="logoutButton"
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Log out"
            aria-label="Log out"
          >
            <span aria-hidden="true">↗</span>
            <span className="logoutLabel">{loggingOut ? "Logging out…" : "Log out"}</span>
          </button>
        </div>
      </aside>
      <div className="dashboardBody">
        <header className="mobileDashHeader">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <Brand compact />
          <span>
            {user.first_name[0]}
            {user.last_name[0]}
          </span>
        </header>
        {children}
      </div>
      {open && (
        <button
          className="navBackdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}
