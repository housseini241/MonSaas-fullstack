import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import InstallPWAButton from "@/components/InstallPWAButton";
import FloatingTabBar from "@/components/FloatingTabBar";
import {
  LayoutGrid, Globe, Users, CalendarRange,
  Link2, CreditCard, Shield, LogOut, Menu, X, ChevronRight, Store,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { to: "/sites", label: "Sites", icon: Globe },
  { to: "/marketplace/profil", label: "Marketplace", icon: Store },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarRange },
  { to: "/domains", label: "Domaines", icon: Link2 },
  { to: "/billing", label: "Facturation", icon: CreditCard },
];



function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 group" data-testid="appshell-logo">
      <img src="/logo.png" alt="Hustart" className="w-9 h-9 object-contain" />
      <div className="flex flex-col leading-none">
        <span className="font-display font-semibold text-[16px] tracking-tight text-ink-1">HuStart</span>
        <span className="t-label mt-1">SaaS · V.2</span>
      </div>
    </Link>
  );
}


function SidebarItem({ to, label, icon: Icon, code, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      data-testid={`nav-${to.replace("/", "")}`}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
          isActive
            ? "bg-primary-light text-primary"
            : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "font-mono text-[10px] tracking-[0.15em] w-6 shrink-0",
              isActive ? "text-primary" : "text-ink-3",
            ].join(" ")}
          >
            {code}
          </span>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium tracking-tight">{label}</span>
          {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell({ children, title, eyebrow, actions }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-ink-1 flex" data-testid="app-shell">
      {/* ============ Sidebar (desktop) ============ */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">          {NAV.map((item) => (
            <SidebarItem key={item.to} {...item} />
          ))}
          {user?.is_admin && (
            <>
              <SidebarItem to="/admin" label="Admin" icon={Shield} />
              <SidebarItem to="/admin/marketplace" label="Appels d'offres" icon={Store} />
            </>
          )}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-2">
            <div className="w-9 h-9 bg-ink-1 text-surface flex items-center justify-center rounded-md font-display font-semibold text-base">
              {(user?.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-ink-1">{user?.full_name || "Utilisateur"}</div>
              <div className="text-[10px] font-mono text-ink-3 truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => { logout(); nav("/"); }}
              data-testid="logout-btn"
              className="text-ink-3 hover:text-destructive transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ Mobile sidebar (overlay) ============ */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" data-testid="mobile-nav-overlay">
          <div
            className="absolute inset-0 bg-ink-1/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-surface border-r border-border flex flex-col shadow-lg">
            <div className="px-5 h-16 flex items-center justify-between border-b border-border">
              <Logo />
              <button onClick={() => setMobileOpen(false)} data-testid="mobile-nav-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
              {NAV.map((item) => (
                <SidebarItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
              ))}
              {user?.is_admin && (
                <>
                  <SidebarItem to="/admin" label="Admin" icon={Shield} onClick={() => setMobileOpen(false)} />
                  <SidebarItem to="/admin/marketplace" label="Appels d'offres" icon={Store} onClick={() => setMobileOpen(false)} />
                </>
              )}
            </nav>
            <div className="border-t border-border p-3">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { logout(); nav("/"); }}>
                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ============ Main column ============ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-background/85 backdrop-blur-xl border-b border-border">
          <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-ink-1"
              onClick={() => setMobileOpen(true)}
              data-testid="mobile-nav-open"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="t-label hidden md:inline">
                / {loc.pathname.replace("/", "") || "dashboard"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <InstallPWAButton />
              {actions}
            </div>
          </div>
        </header>

        {/* Page header */}
        {(title || eyebrow) && (
          <div className="px-4 md:px-8 pt-10 pb-8 border-b border-border bg-surface/40">
            <div className="max-w-7xl mx-auto">
              {eyebrow && <div className="t-label mb-3">{eyebrow}</div>}
              {title && (
                <h1 className="t-display-l md:t-display-xl text-ink-1">
                  {title}
                </h1>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 px-4 md:px-8 py-10 pb-28 lg:pb-10">
          <div className="max-w-7xl mx-auto fade-up">
            {children}
          </div>
        </main>

        <footer className="hidden lg:block px-4 md:px-8 py-6 border-t border-border bg-surface/40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 t-label">
            <span>© 2026 HuStart · MADE WITH CRAFT</span>
            <span>SaaS · v2.0</span>
          </div>
        </footer>
      </div>

      {/* Footer flottant intelligent (mobile/tablette) */}
      <FloatingTabBar />
    </div>
  );
}
