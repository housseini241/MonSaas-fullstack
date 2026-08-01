import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Calendar, Users, FileText, Clock, AlertCircle,
  ArrowUpRight, Hammer, Sparkles,
} from "lucide-react";
import DevisFormModal from "@/components/DevisFormModal";
import AppShell from "@/components/AppShell";

function fmt(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function KPI({ icon: Icon, label, value, sub, accent = false, testId, onClick }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={[
        "group relative text-left p-5 rounded-2xl transition-all duration-200 border",
        accent
          ? "text-white border-transparent shadow-[0_16px_36px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(79,70,229,0.3)]"
          : "bg-white border-[#E4E8F1] hover:border-[#0F1222]/20 hover:shadow-md hover:-translate-y-0.5",
      ].join(" ")}
      style={accent ? { background: "linear-gradient(120deg, #4F46E5, #22D3EE)" } : undefined}
    >
      <div className={["flex items-center gap-2 t-label", accent ? "!text-[#4F46E5]" : ""].join(" ")}>
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div
        className={[
          "font-display font-semibold text-[34px] tracking-tight mt-3 leading-none",
          accent ? "text-white" : "text-[#0F1222]",
        ].join(" ")}
      >
        {value}
      </div>
      {sub && (
        <div className={["text-xs mt-2", accent ? "text-white/60" : "text-[#6B7280]"].join(" ")}>
          {sub}
        </div>
      )}
      <ArrowUpRight
        className={[
          "absolute top-4 right-4 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity",
          accent ? "text-[#4F46E5]" : "text-[#4A4F6B]",
        ].join(" ")}
      />
    </button>
  );
}

export default function DashboardArtisan() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDevisForm, setShowDevisForm] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const r = await api.get("/artisan/analytics/summary");
      setAnalytics(r.data);
    } catch (e) {
      toast.error("Impossible de charger les analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const firstName = (user?.full_name || "").split(" ")[0] || "Artisan";
  const data = analytics || {};

  return (
    <AppShell
      title={
        <>
          Bonjour <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">{firstName}</span>.
        </>
      }
      actions={
        <Button onClick={() => setShowDevisForm(true)} data-testid="create-devis-btn" className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> Nouveau devis
        </Button>
      }
    >
      {loading ? (
        <div className="py-24 flex items-center justify-center text-[#6B7280] font-mono text-sm">
          <span className="cursor-blink">Chargement</span>
        </div>
      ) : (
        <div className="space-y-6" data-testid="dashboard-artisan">
          <div className="sm:hidden">
            <Button onClick={() => setShowDevisForm(true)} data-testid="create-devis-btn-mobile" className="w-full" size="lg">
              <Plus className="w-4 h-4" /> Nouveau devis
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KPI icon={FileText} label="Devis" value={data.devis_count || 0} sub={`${data.devis_en_attente || 0} en attente`} testId="kpi-devis" onClick={() => nav("/clients")} />
            <KPI icon={Calendar} label="Rendez-vous" value={data.rdv_count || 0} sub={`${data.rdv_a_venir || 0} à venir`} testId="kpi-rdv" onClick={() => nav("/agenda")} />
            <KPI icon={Users} label="Clients" value={data.clients_count || 0} sub="base clients" testId="kpi-clients" onClick={() => nav("/clients")} />
          </div>

          {/* Prochains RDV */}
          {data.prochains_rdv && data.prochains_rdv.length > 0 && (
            <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm" data-testid="prochains-rdv">
              <div className="flex items-center justify-between mb-5">
                <div>                  <h3 className="font-display text-display-m mt-1">RDV cette semaine</h3>
                </div>
                <Link to="/agenda">
                  <Button variant="outline" size="sm"><Calendar className="w-3.5 h-3.5" /> Voir agenda</Button>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {data.prochains_rdv.map((rdv) => (
                  <button
                    key={rdv.id}
                    type="button"
                    onClick={() => nav(`/agenda?rdv=${rdv.id}`)}
                    data-testid={`rdv-${rdv.id}`}
                    className="w-full flex items-center gap-4 py-3 hover:bg-[#F4F6FB]/60 -mx-2 px-2 rounded-xl transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-[#EEF0FE] text-[#4F46E5] flex flex-col items-center justify-center rounded-xl shrink-0">
                      <div className="font-display font-semibold text-base leading-none">{new Date(rdv.date).getDate()}</div>
                      <div className="t-label !text-[#4F46E5] mt-0.5">{new Date(rdv.date).toLocaleDateString("fr-FR", { month: "short" })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate text-[#0F1222]">{rdv.titre}</div>
                      <div className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rdv.heure} · {rdv.client_nom || "Sans client"}
                      </div>
                    </div>
                    <Badge variant={rdv.statut === "confirme" ? "success" : "outline"}>{rdv.statut}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Devis en attente */}
          {data.devis_attente && data.devis_attente.length > 0 && (
            <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm" data-testid="devis-attente">
              <div className="flex items-center justify-between mb-5">
                <div>                  <h3 className="font-display text-display-m mt-1">À valider par les clients</h3>
                </div>
                <Link to="/clients">
                  <Button variant="outline" size="sm"><FileText className="w-3.5 h-3.5" /> Voir tous</Button>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {data.devis_attente.slice(0, 5).map((devis) => (
                  <button
                    key={devis.id}
                    type="button"
                    onClick={() => nav(`/devis/${devis.id}`)}
                    data-testid={`devis-${devis.id}`}
                    className="w-full flex items-center justify-between py-3 hover:bg-[#F4F6FB]/60 -mx-2 px-2 rounded-xl transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs uppercase tracking-wider text-[#6B7280]">{devis.numero}</div>
                      <div className="text-sm text-[#0F1222] mt-0.5 truncate">{devis.client_nom}</div>
                    </div>
                    <div className="text-right shrink-0 mr-4">
                      <div className="font-display font-semibold text-base text-[#0F1222]">{fmt(devis.montant_ttc)}</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">{new Date(devis.date).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!data.prochains_rdv?.length && !data.devis_attente?.length && (
            <div className="bg-white border border-[#E4E8F1] rounded-2xl p-12 text-center shadow-sm" data-testid="empty-state">
              <div className="w-14 h-14 mx-auto bg-[#EEF0FE] text-[#4F46E5] rounded-2xl flex items-center justify-center mb-4">
                <Hammer className="w-6 h-6" />
              </div>
              <h3 className="font-display text-display-m mb-2">Tout est calme par ici.</h3>
              <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-6">
                Lancez votre premier devis ou créez un site pour démarrer l'activité.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => setShowDevisForm(true)}><Plus className="w-4 h-4" /> Premier devis</Button>
                <Link to="/sites"><Button variant="outline"><Sparkles className="w-4 h-4" /> Créer un site</Button></Link>
              </div>
            </div>
          )}
        </div>
      )}

      {showDevisForm && (
        <DevisFormModal
          onClose={() => setShowDevisForm(false)}
          onSuccess={() => {
            setShowDevisForm(false);
            loadAnalytics();
            toast.success("Devis créé avec succès");
          }}
        />
      )}
    </AppShell>
  );
}