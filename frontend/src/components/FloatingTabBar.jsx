import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Globe, Users, FileText, Plus } from "lucide-react";
import DevisFormModal from "@/components/DevisFormModal";
import { toast } from "sonner";

/**
 * Footer flottant intelligent — 3 onglets principaux : Site, Clients, Devis.
 * - Détecte automatiquement l'onglet actif selon la route courante.
 * - Affiche un badge dynamique (devis en attente) sur l'onglet Devis.
 * - L'onglet Devis est une action rapide : ouvre directement le formulaire
 *   de création si on tape dessus alors qu'on est déjà sur /clients ou /devis,
 *   sinon il t'y emmène d'abord.
 */
export default function FloatingTabBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [showDevisForm, setShowDevisForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get("/artisan/analytics/summary")
      .then((r) => {
        if (mounted) setPendingCount(r.data?.devis_en_attente || 0);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [loc.pathname]);

  const isSite = loc.pathname.startsWith("/sites") || loc.pathname.startsWith("/builder");
  const isClients = loc.pathname.startsWith("/clients");
  const isDevis = loc.pathname.startsWith("/devis");

  const TABS = [
    {
      key: "site",
      label: "Site",
      icon: Globe,
      active: isSite,
      onClick: () => nav("/sites"),
    },
    {
      key: "clients",
      label: "Clients",
      icon: Users,
      active: isClients,
      onClick: () => nav("/clients"),
    },
    {
      key: "devis",
      label: "Devis",
      icon: FileText,
      active: isDevis,
      badge: pendingCount > 0 ? pendingCount : null,
      onClick: () => {
        if (isClients || isDevis) {
          setShowDevisForm(true);
        } else {
          nav("/clients");
        }
      },
    },
  ];

  return (
    <>
      <nav
        data-testid="floating-tab-bar"
        className="lg:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pointer-events-auto flex items-stretch gap-1 bg-white/90 backdrop-blur-xl border border-[#E4E8F1] rounded-full shadow-[0_16px_40px_rgba(15,18,34,0.14)] px-1.5 py-1.5 w-full max-w-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={tab.onClick}
                data-testid={`floating-tab-${tab.key}`}
                className={[
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition-all duration-200",
                  tab.active
                    ? "text-white shadow-[0_10px_24px_rgba(79,70,229,0.32)]"
                    : "text-[#6B7280] hover:text-[#0F1222] hover:bg-[#F4F6FB]",
                ].join(" ")}
                style={
                  tab.active
                    ? { background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }
                    : undefined
                }
              >
                <span className="relative">
                  <Icon className="w-[18px] h-[18px]" />
                  {tab.badge != null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#F43F5E] text-white text-[9px] font-mono font-semibold flex items-center justify-center leading-none">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                  {tab.key === "devis" && (isClients || isDevis) && !tab.badge && (
                    <span className="absolute -bottom-1 -right-1.5 w-3 h-3 rounded-full bg-white flex items-center justify-center border border-[#E4E8F1]">
                      <Plus className="w-2 h-2 text-[#4F46E5]" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium tracking-tight leading-none mt-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {showDevisForm && (
        <DevisFormModal
          onClose={() => setShowDevisForm(false)}
          onSuccess={() => {
            setShowDevisForm(false);
            toast.success("Devis créé avec succès");
          }}
        />
      )}
    </>
  );
}
