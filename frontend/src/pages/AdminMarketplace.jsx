import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Shield, Mail, Plus, Trash2, Loader2, Megaphone, Eye, MessageSquareText,
  Hammer, Inbox, UserPlus, TrendingUp,
} from "lucide-react";
import AppShell from "@/components/AppShell";

const TRADES = [
  "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
  "Chauffage", "Couverture", "Carrelage", "Paysagiste", "Serrurerie",
  "Plâtrerie", "Rénovation", "Climatisation", "Jardinage", "Nettoyage",
];

const LOGEMENTS = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "local_pro", label: "Local professionnel" },
  { value: "autre", label: "Autre" },
];

const URGENCES = [
  { value: "normal", label: "Normal", desc: "Sous 2-3 semaines" },
  { value: "urgent", label: "Urgent", desc: "Sous 1 semaine" },
  { value: "tres_urgent", label: "Très urgent", desc: "Sous 48h" },
];

const STATUS_LIST = ["nouvelle", "en_cours", "pourvue", "archivee"];
const STATUS_LABELS = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  pourvue: "Pourvue",
  archivee: "Archivée",
};

const SOURCES = ["manuel", "client"];

const URGENCE_LABELS = {
  normal: "Normal",
  urgent: "Urgent",
  tres_urgent: "Très urgent",
};

const EMPTY_FORM = {
  type_travaux: "",
  besoin: "",
  urgence: "normal",
  city: "",
  code_postal: "",
  type_logement: "",
  name: "",
  email: "",
  phone: "",
  origin_note: "",
};

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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function DemandeBadges({ demande }) {
  const sourceLabel = demande.source === "manuel" ? "manuel" : "client";
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={demande.urgence === "tres_urgent" ? "destructive" : demande.urgence === "urgent" ? "warning" : "secondary"}>
        {URGENCE_LABELS[demande.urgence] || demande.urgence}
      </Badge>
      <Badge variant={demande.source === "manuel" ? "default" : "outline"}>
        {sourceLabel}
      </Badge>
      <Badge variant="soft">{STATUS_LABELS[demande.status] || demande.status}</Badge>
    </div>
  );
}

export default function AdminMarketplace() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [autoLoading, setAutoLoading] = useState(true);

  // Onglet publier
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  // Onglet demandes
  const [demandes, setDemandes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Onglet campagne
  const [campaignDemandes, setCampaignDemandes] = useState([]);
  const [selectedDemandeId, setSelectedDemandeId] = useState("");
  const [campaignTrade, setCampaignTrade] = useState("__none");
  const [campaignCity, setCampaignCity] = useState("");
  const [campaignResult, setCampaignResult] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Onglet stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.is_admin) {
      toast.error("Accès admin requis");
      nav("/dashboard");
      return;
    }
    setLoading(false);
    setAutoLoading(false);
  }, [user, nav]);

  const loadDemandes = useCallback(async (pageNum = 1) => {
    try {
      const params = { page: pageNum, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (sourceFilter !== "all") params.source = sourceFilter;
      const res = await api.get("/admin/marketplace/demandes", { params });
      setDemandes(res.data.demandes || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
      setPage(res.data.page || pageNum);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur de chargement des demandes");
    }
  }, [statusFilter, sourceFilter]);

  const loadCampaignDemandes = useCallback(async () => {
    try {
      const res = await api.get("/admin/marketplace/demandes", {
        params: { page: 1, limit: 100 },
      });
      const all = res.data.demandes || [];
      const available = all.filter((d) => d.status === "nouvelle" || d.status === "en_cours");
      setCampaignDemandes(available);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur de chargement des demandes");
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/marketplace/stats");
      setStats(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur de chargement des statistiques");
    }
  }, []);

  useEffect(() => {
    if (!user?.is_admin) return;
    loadDemandes(1);
    loadCampaignDemandes();
    loadStats();
  }, [user, loadDemandes, loadCampaignDemandes, loadStats]);

  useEffect(() => {
    if (!user?.is_admin) return;
    loadDemandes(1);
  }, [statusFilter, sourceFilter, loadDemandes]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreateDemande = async () => {
    if (form.besoin.length < 10) {
      toast.error("La description du besoin doit contenir au moins 10 caractères");
      return;
    }
    if (form.city.length < 2) {
      toast.error("La ville est requise");
      return;
    }
    if (form.name.length < 2 || form.email.length < 5) {
      toast.error("Nom et email du prospect sont requis");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/marketplace/demandes", form);
      toast.success("Appel d'offres publié avec succès !");
      setForm({ ...EMPTY_FORM });
      loadDemandes(1);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (demandeId, status) => {
    try {
      await api.put(`/admin/marketplace/demandes/${demandeId}`, { status });
      toast.success("Statut mis à jour");
      loadDemandes(page);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const handleDeleteDemande = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/marketplace/demandes/${deleteTarget.id}`);
      toast.success("Demande supprimée");
      setDeleteTarget(null);
      loadDemandes(page);
      loadCampaignDemandes();
      loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectCampaignDemande = (id) => {
    setSelectedDemandeId(id);
    setCampaignResult(null);
    const demande = campaignDemandes.find((d) => d.id === id);
    if (demande) {
      setCampaignTrade(demande.type_travaux || "__none");
      setCampaignCity(demande.city || "");
    }
  };

  const handleSendCampaign = async () => {
    if (!selectedDemandeId) {
      toast.error("Sélectionnez une demande");
      return;
    }
    setSendingCampaign(true);
    setCampaignResult(null);
    try {
      const res = await api.post("/admin/marketplace/campaigns", {
        demande_id: selectedDemandeId,
        trade: campaignTrade === "__none" ? null : campaignTrade,
        city: campaignCity || null,
      });
      setCampaignResult(res.data);
      toast.success(`${res.data.sent} email(s) envoyé(s)`);
      loadDemandes(page);
      loadCampaignDemandes();
      loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi de la campagne");
    } finally {
      setSendingCampaign(false);
    }
  };

  if (!user?.is_admin) return null;

  return (
    <AppShell
      title={<>Appels d'offres <span className="font-light italic text-primary">Marketplace</span></>}
      actions={
        <Badge variant="default" className="hidden sm:inline-flex">
          <Shield className="w-3 h-3 mr-1.5" /> Admin
        </Badge>
      }
    >
      {loading || autoLoading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div data-testid="admin-marketplace-page">
          <Tabs defaultValue="publier" className="w-full">
            <TabsList className="h-11 bg-surface border border-border rounded-md p-1 gap-1 flex flex-nowrap overflow-x-auto">
              <TabsTrigger value="publier" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-publier">
                <Plus className="w-3.5 h-3.5 mr-2" /> Publier
              </TabsTrigger>
              <TabsTrigger value="demandes" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-demandes">
                <Inbox className="w-3.5 h-3.5 mr-2" /> Demandes ({total})
              </TabsTrigger>
              <TabsTrigger value="campagne" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-campagne">
                <Megaphone className="w-3.5 h-3.5 mr-2" /> Campagne
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-sm data-[state=active]:bg-primary-light data-[state=active]:text-primary px-4 h-9 text-ink-2 font-medium" data-testid="tab-stats">
                <TrendingUp className="w-3.5 h-3.5 mr-2" /> Stats
              </TabsTrigger>
            </TabsList>

            {/* ========== Onglet Publier ========== */}
            <TabsContent value="publier" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-4">
                <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="font-display text-display-m mb-1">Description du besoin</h2>
                  <p className="text-ink-3 text-xs mb-6">Ces informations sont publiques (sauf les champs privés ci-dessous).</p>

                  <div className="space-y-5">
                    <div>
                      <Label className="t-label mb-2 block">Métier recherché</Label>
                      <Select value={form.type_travaux} onValueChange={(v) => set("type_travaux", v)}>
                        <SelectTrigger className="h-10 bg-surface border-border rounded-md" data-testid="admin-demande-trade">
                          <SelectValue placeholder="Sélectionnez un métier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Sélectionnez un métier</SelectItem>
                          {TRADES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="t-label mb-2 block">Besoin <span className="text-destructive">*</span></Label>
                      <Textarea
                        value={form.besoin}
                        onChange={(e) => set("besoin", e.target.value)}
                        rows={5}
                        className="bg-surface border-border rounded-md"
                        placeholder="Ex : Rénovation complète de salle de bain 6m² à Lyon..."
                        data-testid="admin-demande-besoin"
                      />
                      <div className="text-[11px] text-ink-3 mt-1 font-mono">{form.besoin.length}/2000</div>
                    </div>

                    <div>
                      <Label className="t-label mb-3 block">Urgence</Label>
                      <RadioGroup value={form.urgence} onValueChange={(v) => set("urgence", v)} className="grid md:grid-cols-3 gap-2">
                        {URGENCES.map((u) => (
                          <label
                            key={u.value}
                            className={[
                              "flex flex-col gap-0.5 p-3 border rounded-md cursor-pointer transition-colors",
                              form.urgence === u.value ? "border-ink-1 bg-ink-1 text-surface" : "border-border bg-surface hover:border-ink-2",
                            ].join(" ")}
                          >
                            <RadioGroupItem value={u.value} className="sr-only" />
                            <span className="font-medium text-sm">{u.label}</span>
                            <span className={["text-[11px]", form.urgence === u.value ? "text-surface/70" : "text-ink-3"].join(" ")}>{u.desc}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="t-label mb-2 block">Ville <span className="text-destructive">*</span></Label>
                        <Input
                          value={form.city}
                          onChange={(e) => set("city", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="Lyon"
                          data-testid="admin-demande-city"
                        />
                      </div>
                      <div>
                        <Label className="t-label mb-2 block">Code postal</Label>
                        <Input
                          value={form.code_postal}
                          onChange={(e) => set("code_postal", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="69000"
                          data-testid="admin-demande-cp"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="t-label mb-2 block">Type de logement</Label>
                      <Select value={form.type_logement} onValueChange={(v) => set("type_logement", v)}>
                        <SelectTrigger className="h-10 bg-surface border-border rounded-md" data-testid="admin-demande-logement">
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOGEMENTS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <div className="space-y-4">
                  <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-display text-display-m">Coordonnées prospect</h2>
                      <Badge variant="warning"><Eye className="w-3 h-3 mr-1" /> privé</Badge>
                    </div>
                    <p className="text-ink-3 text-xs mb-6">
                      Jamais affichées publiquement ni incluses dans les emails de campagne. Un artisan
                      authentifié les voit uniquement après avoir cliqué « Répondre ».
                    </p>

                    <div className="space-y-5">
                      <div>
                        <Label className="t-label mb-2 block">Nom complet <span className="text-destructive">*</span></Label>
                        <Input
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="Jean Dupont"
                          data-testid="admin-demande-name"
                        />
                      </div>
                      <div>
                        <Label className="t-label mb-2 block">Email <span className="text-destructive">*</span></Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="jean@exemple.fr"
                          data-testid="admin-demande-email"
                        />
                      </div>
                      <div>
                        <Label className="t-label mb-2 block">Téléphone</Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="06 12 34 56 78"
                          data-testid="admin-demande-phone"
                        />
                      </div>
                      <div>
                        <Label className="t-label mb-2 block">Origine (note interne)</Label>
                        <Input
                          value={form.origin_note}
                          onChange={(e) => set("origin_note", e.target.value)}
                          className="h-10 bg-surface border-border rounded-md"
                          placeholder="Ex : trouvé sur le groupe Facebook Artisans Lyon"
                          data-testid="admin-demande-origin"
                        />
                      </div>
                    </div>
                  </section>

                  <Button
                    onClick={handleCreateDemande}
                    disabled={submitting}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl shadow-primary"
                    data-testid="demande-form-submit"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publication...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Publier l'appel d'offres</>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ========== Onglet Demandes ========== */}
            <TabsContent value="demandes" className="mt-6">
              <section className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-display-m mt-1">Demandes ({total})</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                      <SelectTrigger className="h-9 w-40 bg-surface border-border rounded-md" data-testid="admin-demande-status-filter">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {STATUS_LIST.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
                      <SelectTrigger className="h-9 w-40 bg-surface border-border rounded-md" data-testid="admin-demande-source-filter">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les sources</SelectItem>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table data-testid="admin-demandes-table">
                    <TableHeader>
                      <TableRow className="border-b border-border bg-surface-2/40">
                        <TableHead className="px-6 py-3 t-label">Ville</TableHead>
                        <TableHead className="px-6 py-3 t-label">Métier</TableHead>
                        <TableHead className="px-6 py-3 t-label">Statut</TableHead>
                        <TableHead className="px-6 py-3 t-label">Vues</TableHead>
                        <TableHead className="px-6 py-3 t-label">Réponses</TableHead>
                        <TableHead className="px-6 py-3 t-label">Créée le</TableHead>
                        <TableHead className="px-6 py-3 t-label">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demandes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="px-6 py-10 text-center text-ink-3">
                            Aucune demande trouvée.
                          </TableCell>
                        </TableRow>
                      ) : (
                        demandes.map((d) => (
                          <TableRow key={d.id} className="border-b border-border hover:bg-surface-2/40 transition-colors" data-testid={`admin-demande-row-${d.id}`}>
                            <TableCell className="px-6 py-3 text-ink-1 font-medium">{d.city}</TableCell>
                            <TableCell className="px-6 py-3 text-ink-2">{d.type_travaux || "—"}</TableCell>
                            <TableCell className="px-6 py-3"><DemandeBadges demande={d} /></TableCell>
                            <TableCell className="px-6 py-3 font-mono text-xs text-ink-2">{d.views_count || 0}</TableCell>
                            <TableCell className="px-6 py-3">
                              <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-2">
                                <MessageSquareText className="w-3.5 h-3.5 text-ink-3" /> {(d.responses || []).length}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-ink-3 text-xs font-mono">{formatDate(d.created_at)}</TableCell>
                            <TableCell className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <Select value={d.status} onValueChange={(v) => handleStatusChange(d.id, v)}>
                                  <SelectTrigger className="h-8 w-32 bg-surface border-border rounded-md" data-testid={`admin-demande-status-${d.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_LIST.map((s) => (
                                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-destructive border-border hover:bg-destructive/5"
                                      data-testid={`admin-demande-delete-${d.id}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent data-testid="admin-demande-delete-dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        La demande à {d.city} ({d.type_travaux || "métier non précisé"}) sera définitivement
                                        supprimée, avec son historique de campagne.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-md border-border">Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => { setDeleteTarget(d); handleDeleteDemande(); }}
                                      >
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-ink-3 font-mono">
                    Page {page} / {totalPages} · {total} demande(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md border-border"
                      disabled={page <= 1}
                      onClick={() => loadDemandes(page - 1)}
                      data-testid="admin-demande-prev"
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md border-border"
                      disabled={page >= totalPages}
                      onClick={() => loadDemandes(page + 1)}
                      data-testid="admin-demande-next"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ========== Onglet Campagne ========== */}
            <TabsContent value="campagne" className="mt-6">
              <section className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-display-m mt-1">Campagne email vers les artisans</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-warning/10 border border-warning/30 rounded-md px-4 py-3 flex items-start gap-2">
                    <Eye className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Les coordonnées du prospect (nom, email, téléphone) ne sont <strong>jamais incluses</strong> dans
                      cet email. Les artisans reçoivent uniquement le teaser anonymisé et doivent se connecter pour
                      consulter la demande complète.
                    </p>
                  </div>

                  <div>
                    <Label className="t-label mb-2 block">Demande à promouvoir</Label>
                    <Select value={selectedDemandeId} onValueChange={handleSelectCampaignDemande}>
                      <SelectTrigger className="h-10 bg-surface border-border rounded-md" data-testid="campaign-demande-select">
                        <SelectValue placeholder="Sélectionnez une demande" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignDemandes.length === 0 ? (
                          <SelectItem value="__none" disabled>Aucune demande disponible</SelectItem>
                        ) : (
                          campaignDemandes.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.city} — {d.type_travaux || "métier non précisé"} ({STATUS_LABELS[d.status]})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="t-label mb-2 block">Métier ciblé</Label>
                      <Select value={campaignTrade} onValueChange={setCampaignTrade}>
                        <SelectTrigger className="h-10 bg-surface border-border rounded-md" data-testid="campaign-trade">
                          <SelectValue placeholder="Tous les métiers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Tous les métiers</SelectItem>
                          {TRADES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="t-label mb-2 block">Ville ciblée</Label>
                      <Input
                        value={campaignCity}
                        onChange={(e) => setCampaignCity(e.target.value)}
                        className="h-10 bg-surface border-border rounded-md"
                        placeholder="Lyon"
                        data-testid="campaign-city"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendCampaign}
                    disabled={sendingCampaign}
                    className="h-11 px-6 bg-primary text-primary-foreground rounded-xl shadow-primary"
                    data-testid="campaign-send"
                  >
                    {sendingCampaign ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
                    ) : (
                      <><Mail className="w-4 h-4 mr-2" /> Envoyer la campagne</>
                    )}
                  </Button>

                  {campaignResult && (
                    <div
                      className="bg-success/10 border border-success/30 rounded-md px-4 py-3"
                      data-testid="campaign-result"
                    >
                      <p className="text-sm text-ink-1 font-medium">
                        {campaignResult.sent} / {campaignResult.targeted} email(s) envoyé(s)
                      </p>
                      <p className="text-xs text-ink-3 mt-1">
                        {campaignResult.targeted === 0
                          ? "Aucun artisan ne correspond aux critères. Vérifiez la ville / le métier."
                          : `${campaignResult.targeted} artisan(s) ciblé(s).`}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </TabsContent>

            {/* ========== Onglet Stats ========== */}
            <TabsContent value="stats" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard icon={Inbox} label="demandes totales" value={stats?.total_demandes || 0} sublabel="manuelles + clients" />
                <StatCard icon={Hammer} label="demandes manuelles" value={stats?.demandes_manuelles || 0} sublabel="sourcées hors plateforme" />
                <StatCard icon={Mail} label="emails envoyés" value={stats?.emails_envoyes || 0} sublabel="campagnes appels d'offres" />
                <StatCard icon={UserPlus} label="comptes créés" value={stats?.comptes_crees || 0} sublabel="inscrits via le canal" />
                <StatCard icon={MessageSquareText} label="devis envoyés" value={stats?.devis_envoyes || 0} sublabel="réponses des artisans" accent />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
