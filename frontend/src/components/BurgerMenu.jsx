import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Menu, X, TrendingUp, Users, Calendar, FileText,
  Globe, Crown, LogOut, Sparkles, User, ArrowRight
} from "lucide-react";

/**
 * Menu burger universel — visible sur mobile ET desktop.
 * Ouvre un drawer (slide-in) avec tous les liens de navigation.
 */
export default function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const close = () => setOpen(false);

  const navItems = [
    { to: "/dashboard", label: "Accueil", icon: TrendingUp, testId: "menu-accueil" },
    { to: "/pipeline", label: "Pipeline prospects", icon: ArrowRight, testId: "menu-pipeline" },
    { to: "/clients", label: "Clients", icon: Users, testId: "menu-clients" },
    { to: "/agenda", label: "Agenda", icon: Calendar, testId: "menu-agenda" },
    { to: "/sites", label: "Mon site web", icon: Globe, testId: "menu-sites" },
    { to: "/domains", label: "Domaines", icon: Globe, testId: "menu-domains" },
    { to: "/billing", label: "Facturation", icon: Crown, testId: "menu-billing" },
  ];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  const handleLogout = () => {
    logout();
    close();
    nav("/");
  };

  return (
    <>
      {/* Burger button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-sm"
        data-testid="burger-menu-btn"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={close}
          data-testid="burger-overlay"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white border-l border-border z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="burger-drawer"
      >
        {/* Header */}
        <div className="border-b border-border p-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              // menu
            </div>
            <div className="font-display font-semibold text-lg tracking-tight mt-0.5">
              Navigation
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="rounded-sm"
            data-testid="burger-close-btn"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User info */}
        {user && (
          <div className="border-b border-border p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground flex items-center justify-center">
              <span className="text-white font-display font-semibold">
                {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-semibold text-sm truncate">{user.full_name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={close}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-display border-l-4 transition-colors ${
                  active
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-transparent hover:bg-background text-muted-foreground"
                }`}
                data-testid={item.testId}
              >
                <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}

          {user?.is_admin && (
            <>
              <div className="border-t border-border my-3" />
              <Link
                to="/admin"
                onClick={close}
                className="flex items-center gap-3 px-5 py-3 text-sm font-display border-l-4 border-transparent hover:bg-background text-primary"
                data-testid="menu-admin"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </Link>
            </>
          )}
        </nav>

        {/* Footer / logout */}
        <div className="border-t border-border p-5">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full rounded-sm border-border hover:bg-red-600 hover:text-white hover:border-red-600"
            data-testid="menu-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  );
}
