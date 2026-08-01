import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, MapPin, ExternalLink, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";

/*
  Cette page suppose que l'utilisateur n'a qu'un seul site (comme le reste
  de Hustart : "un site par utilisateur"). On récupère d'abord son site via
  /api/sites (déjà utilisé par Sites.jsx), on prend le premier, puis on
  charge/sauvegarde sa visibilité marketplace via les routes existantes :
    GET  /api/marketplace/sites/{site_id}/visibility
    PUT  /api/marketplace/sites/{site_id}/visibility

  Adapte l'appel `api.get("/sites")` si ton endpoint de listing des sites
  a un autre nom chez toi.
*/

const DISPO_OPTIONS = [
  { value: "disponible", label: "Disponible" },
  { value: "occupe", label: "Occupé" },
  { value: "conges", label: "En congés" },
];

export default function MarketplaceSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteId, setSiteId] = useState(null);
  const [siteStatus, setSiteStatus] = useState(null);
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const sitesRes = await api.get("/sites");
      const sites = sitesRes.data?.sites || sitesRes.data || [];
      const mySite = Array.isArray(sites) ? sites[0] : null;

      if (!mySite) {
        setData(null);
        setLoading(false);
        return;
      }

      setSiteId(mySite.id);
      setSiteStatus(mySite.status);
      const visRes = await api.get(`/artisan/marketplace/sites/${mySite.id}/visibility`);
      setData(visRes.data);
    } catch (e) {
      toast.error("Impossible de charger votre profil marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (patch) => {
    if (!siteId) return;
    setSaving(true);
    const next = { ...data, ...patch };
    setData(next); // optimistic
    try {
      const res = await api.put(`/artisan/marketplace/sites/${siteId}/visibility`, patch);
      setData(res.data);
      toast.success("Profil marketplace mis à jour");
    } catch (e) {
      toast.error("Échec de la mise à jour");
      load(); // rollback en rechargeant l'état réel
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Marketplace" eyebrow="Votre espace public">
        <div className="py-24 flex items-center justify-center text-[#6B7280]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Marketplace" eyebrow="Votre espace public">
        <div className="bg-white border border-[#E4E8F1] rounded-xl p-12 text-center">
          <Store className="w-8 h-8 mx-auto text-[#6B7280] mb-4" />
          <h3 className="font-display text-xl mb-2">Créez d'abord votre site</h3>
          <p className="text-[#6B7280] text-sm mb-6">
            Votre fiche marketplace est générée à partir de votre site. Créez-en un pour apparaître dans l'annuaire.
          </p>
          <Link to="/sites">
            <Button>Créer mon site</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Votre fiche marketplace"
      eyebrow="Annuaire public"
      actions={
        data.slug && (
          <Link to={`/marketplace/artisan/${data.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              Voir ma fiche publique <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        )
      }
    >
      <div className="space-y-6 max-w-2xl">
        {siteStatus && siteStatus !== "published" && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-[#4A4F6B]">
            Votre site n'est pas encore publié. Même si vous activez la visibilité marketplace ici,
            votre fiche n'apparaîtra dans l'annuaire qu'une fois le site publié (Sites → Builder → Publier).
          </div>
        )}

        {/* Visibilité */}
        <div className="bg-white border border-[#E4E8F1] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg tracking-tight text-[#0F1222]">Visible dans l'annuaire</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                Activez pour apparaître dans les recherches marketplace des clients.
              </p>
            </div>
            <Switch
              checked={!!data.marketplace_visible}
              onCheckedChange={(v) => save({ marketplace_visible: v })}
              disabled={saving}
              data-testid="marketplace-visible-toggle"
            />
          </div>
        </div>

        {/* Disponibilité */}
        <div className="bg-white border border-[#E4E8F1] rounded-xl p-6">
          <h3 className="font-display text-lg tracking-tight text-[#0F1222] mb-4">Disponibilité</h3>
          <div className="grid grid-cols-3 gap-2">
            {DISPO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => save({ disponibilite: opt.value })}
                disabled={saving}
                className={[
                  "px-3 py-2.5 rounded-2xl text-sm font-medium border transition-colors",
                  data.disponibilite === opt.value
                    ? "bg-[#EEF0FE] text-[#4F46E5] border-primary/30"
                    : "border-[#E4E8F1] text-[#4A4F6B] hover:bg-[#F4F6FB]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone d'intervention */}
        <div className="bg-white border border-[#E4E8F1] rounded-xl p-6">
          <h3 className="font-display text-lg tracking-tight text-[#0F1222] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#6B7280]" /> Zone d'intervention
          </h3>
          <Label className="t-label">Rayon autour de {data.city || "votre ville"}</Label>
          <div className="flex items-center gap-3 mt-2">
            <Input
              type="number"
              min={1}
              max={200}
              value={data.zone_km || 30}
              onChange={(e) => setData({ ...data, zone_km: Number(e.target.value) })}
              onBlur={() => save({ zone_km: data.zone_km })}
              className="w-28"
            />
            <span className="text-sm text-[#6B7280]">km</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}