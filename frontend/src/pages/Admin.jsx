import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Users, Globe, Inbox, Crown, TrendingUp,
  Loader2, Wand2, MessageSquarePlus,
} from "lucide-react";
import LandingEditor from "@/components/LandingEditor";
import ReviewsModeration from "@/components/ReviewsModeration";
import AppShell from "@/components/AppShell";

function StatCard({ icon: Icon, label, value, sublabel, accent }) {
  return (
    <div
      className={[
        "rounded-xl p-6 border transition-shadow",
        accent ? "bg-ink-1 text-surface border-ink-1 shadow-md" : "bg-surface border-border shadow-sm",
      ].join(" ")}
      data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={["t-label", accent ? "!text-primary" : ""].join(" ")}>{label}</div>
        <Icon className={["w-4 h-4", accent ? "text-primary" : "text-ink-2"].join(" ")} />
      </div>
      <div className="font-display font-semibold text-4xl tracking-tight">{value}</div>
      {sublabel && (
        <div className={["text-xs mt-1", accent ? "text-surface/60" : "text-ink-3"].join(" ")}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) {
      toast.error("Accès admin requis");
      nav("/dashboard");
      return;
    }
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/admin/reviews/pending-count").catch(() => ({ data: { pending: 0 } })),
    ])
      .then(([s, u, p]) => { setStats(s.data); setUsers(u.data); setPendingCount(p.data?.pending || 0); })
      .catch((e) => toast.error(e?.response?.data?.detail || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [user, nav]);

  if (!user?.is_admin) return null;

  const totalRevenue = (stats?.revenue_by_currency || []).reduce((acc, r) => acc + (r.total || 0), 0);
  const currency = stats?.revenue_by_currency?.[0]?._id?.toUpperCase() || "EUR";

  return (
    <AppShell
      title={<>Administration <span className="font-light italic text-primary">HuStart</span></>}
      actions={
        <Badge variant="default" className="hidden sm:inline-flex">
          <Shield className="w-3 h-3 mr-1.5" /> Admin
        </Badge>
      }
    >
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div data-testid="admin-page">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-11 bg-surface border border-border rounded-md p-1 gap-1 flex flex-nowrap overflow-x-auto">
              <TabsTrigger value="overview" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="landing" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-landing">
                <Wand2 className="w-3.5 h-3.5 mr-2" /> Édition Landing
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium relative" data-testid="tab-reviews">
                <MessageSquarePlus className="w-3.5 h-3.5 mr-2" /> Modération
                {pendingCount > 0 && (
                  <span
                    className="ml-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono"
                    data-testid="pending-count-badge"
                  >
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-users">Utilisateurs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Users}      label="utilisateurs"     value={stats?.users || 0}         sublabel={`${stats?.pro_users || 0} en plan Pro`} />
                <StatCard icon={Globe}      label="sites créés"      value={stats?.sites || 0}         sublabel={`${stats?.published_sites || 0} publiés`} />
                <StatCard icon={Inbox}      label="leads collectés"  value={stats?.leads || 0}         sublabel="formulaires de contact" />
                <StatCard icon={TrendingUp} label="revenu encaissé"  value={`${totalRevenue.toFixed(0)}€`} sublabel={`${stats?.paid_transactions || 0} transactions ${currency}`} accent />
              </div>
            </TabsContent>

            <TabsContent value="landing" className="mt-6">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <LandingEditor />
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <ReviewsModeration />
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <section className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border">                  <h2 className="font-display text-display-m mt-1">Comptes ({users.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="admin-users-table">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/40">
                        <th className="text-left px-6 py-3 t-label">Email</th>
                        <th className="text-left px-6 py-3 t-label">Nom</th>
                        <th className="text-left px-6 py-3 t-label">Plan</th>
                        <th className="text-left px-6 py-3 t-label">Sites</th>
                        <th className="text-left px-6 py-3 t-label">Inscrit le</th>
                        <th className="text-left px-6 py-3 t-label">Rôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isPro = u.pro_until && new Date(u.pro_until) > new Date();
                        return (
                          <tr key={u.id} className="border-b border-border hover:bg-surface-2/40 transition-colors" data-testid={`admin-user-${u.id}`}>
                            <td className="px-6 py-3 font-mono text-xs text-ink-2">{u.email}</td>
                            <td className="px-6 py-3 text-ink-1">{u.full_name}</td>
                            <td className="px-6 py-3">
                              {isPro ? (
                                <Badge variant="default"><Crown className="w-3 h-3 mr-1" /> pro</Badge>
                              ) : (
                                <span className="t-label">free</span>
                              )}
                            </td>
                            <td className="px-6 py-3 font-display font-semibold text-ink-1">{u.sites_count}</td>
                            <td className="px-6 py-3 text-ink-3 text-xs font-mono">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                            <td className="px-6 py-3">
                              {u.is_admin ? (
                                <Badge variant="soft"><Shield className="w-3 h-3 mr-1" /> admin</Badge>
                              ) : (
                                <span className="text-ink-3 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
