"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { api, getSession, setSession, type User } from "@/lib/api";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";

const links = [
  ["/dashboard", "home", "Overview"],
  ["/dashboard/chat", "chat", "Style with Clo"],
  ["/dashboard/wardrobe", "wardrobe", "My wardrobe"],
  ["/dashboard/try-ons", "tryon", "Try-ons"],
  ["/dashboard/subscription", "billing", "Plan & billing"],
  ["/dashboard/profile", "profile", "Style profile"],
  ["/dashboard/settings", "settings", "Settings"],
];

const mobileLinks = [
  ["/dashboard", "Home", "home"],
  ["/dashboard/chat", "Clo", "chat"],
  ["/dashboard/wardrobe", "Wardrobe", "wardrobe"],
  ["/dashboard/try-ons", "Try-ons", "tryon"],
  ["/dashboard/profile", "Profile", "profile"],
];

function DashboardNavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="M3.5 10.5 12 3l8.5 7.5" />
        <path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5.5 4v-4.6A2.5 2.5 0 0 1 4 13.9Z" />
        <path d="M8 8h8M8 12h5" />
      </>
    ),
    wardrobe: (
      <>
        <path d="M8 4h8l3 4v12H5V8Z" />
        <path d="M5 8h14M9 4a3 3 0 0 1 6 0" />
      </>
    ),
    tryon: (
      <>
        <path d="M9 4a3 3 0 0 1 6 0c0 1.8-3 2.1-3 4" />
        <path d="m12 8-8 5 2 3 2-1v6h8v-6l2 1 2-3Z" />
      </>
    ),
    billing: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <path d="M3.5 9h17M7 15h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.55h.4A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4.05v.4A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.4v4.05h-.4A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
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
              <i>
                <DashboardNavIcon name={icon} />
              </i>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
            </svg>
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
      <nav className="mobileTabBar" aria-label="Dashboard navigation">
        {mobileLinks.map(([href, label, icon]) => {
          const selected = path === href;
          return (
            <Link key={href} href={href} className={selected ? "active" : ""}>
              <DashboardNavIcon name={icon} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
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
