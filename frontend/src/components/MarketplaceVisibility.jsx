import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, Save, ImagePlus, X, Check, Globe, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { resolveImg } from "@/lib/api";
import api from "@/lib/api";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MarketplaceVisibility({ siteId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vis, setVis] = useState({
    marketplace_visible: false,
    disponibilite: "disponible",
    zone_km: 30,
    gallery: [],
    verified: false,
    business_name: "",
    business_type: "",
    city: "",
    slug: "",
    hero_image_url: null,
  });

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    api.get(`/marketplace/sites/${siteId}/visibility`)
      .then((r) => setVis(r.data))
      .catch(() => toast.error("Impossible de charger les paramètres"))
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/marketplace/sites/${siteId}/visibility`, {
        marketplace_visible: vis.marketplace_visible,
        disponibilite: vis.disponibilite,
        zone_km: vis.zone_km,
        gallery: vis.gallery,
      });
      toast.success("Visibilité mise à jour");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (vis.gallery.length >= 5) {
      toast.error("Maximum 5 photos");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "gallery");
    try {
      // Reuse the same upload approach as shop images
      const r = await api.post(`/sites/${siteId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVis((v) => ({ ...v, gallery: [...v.gallery, r.data.url] }));
      toast.success("Photo ajoutée");
    } catch (e) {
      toast.error("Erreur d'upload — utilisez plutôt le builder du site pour ajouter des images");
    }
  };

  const removeGallery = (idx) => {
    setVis((v) => ({ ...v, gallery: v.gallery.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const profileUrl = vis.marketplace_visible && vis.slug
    ? `${window.location.origin}/marketplace/artisan/${vis.slug}`
    : null;

  return (
    <div className="space-y-6" data-testid="marketplace-visibility">
      {/* Status banner */}
      <div className={`p-4 rounded-md border ${vis.marketplace_visible ? "bg-success/5 border-success/20" : "bg-ink-1/5 border-ink-1/10"}`}>
        <div className="flex items-center gap-3">
          <Globe className={`w-5 h-5 ${vis.marketplace_visible ? "text-success" : "text-ink-3"}`} />
          <div>
            <div className="font-display font-semibold text-sm text-ink-1">
              Statut : {vis.marketplace_visible ? "● Visible dans l'annuaire" : "○ Non visible"}
            </div>
            {vis.marketplace_visible && profileUrl && (
              <a href={profileUrl} target="_blank" className="text-xs text-primary hover:underline mt-0.5 inline-block">
                Voir mon profil public →
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Toggle visibilité */}
        <div className="bg-white border border-border rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base tracking-tight text-ink-1">Visibilité dans l'annuaire</h3>
              <p className="text-xs text-ink-3 mt-1">Apparaître dans les résultats de recherche marketplace</p>
            </div>
            <Switch
              checked={vis.marketplace_visible}
              onCheckedChange={(v) => setVis(s => ({ ...s, marketplace_visible: v }))}
              data-testid="toggle-visibility"
            />
          </div>
          {vis.marketplace_visible && (
            <div className="text-xs font-mono text-ink-3 bg-surface-2 p-2 rounded-sm">
              {vis.business_name} · {vis.business_type} · {vis.city}
            </div>
          )}
        </div>

        {/* Disponibilité */}
        <div className="bg-white border border-border rounded-md p-6">
          <h3 className="font-display font-semibold text-base tracking-tight text-ink-1 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-3" /> Disponibilité
          </h3>
          <div className="flex gap-2">
            {[
              { value: "disponible", label: "Disponible" },
              { value: "occupe", label: "Occupé" },
              { value: "conges", label: "En congés" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVis(s => ({ ...s, disponibilite: opt.value }))}
                data-testid={`dispo-${opt.value}`}
                className={`flex-1 py-2.5 text-sm font-medium rounded-sm border transition-colors ${
                  vis.disponibilite === opt.value
                    ? "bg-ink-1 text-white border-ink-1"
                    : "bg-white text-ink-2 border-border hover:border-ink-2"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zone d'intervention */}
      <div className="bg-white border border-border rounded-md p-6">
        <h3 className="font-display font-semibold text-base tracking-tight text-ink-1 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-ink-3" /> Zone d'intervention
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-ink-2 bg-surface-2 px-3 py-2 rounded-sm font-medium">{vis.city || "Ville"}</div>
          <span className="text-ink-3">+</span>
          <Input
            type="number"
            value={vis.zone_km}
            onChange={(e) => setVis(s => ({ ...s, zone_km: parseInt(e.target.value) || 30 }))}
            className="w-24 h-10 rounded-sm border-border text-center"
            min={1}
            max={200}
            data-testid="zone-km"
          />
          <span className="text-sm text-ink-3">km</span>
        </div>
      </div>

      {/* Galerie */}
      <div className="bg-white border border-border rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-base tracking-tight text-ink-1">Galerie réalisations</h3>
            <p className="text-xs text-ink-3 mt-1">{vis.gallery.length}/5 photos — Montrez vos plus beaux chantiers</p>
          </div>
          {vis.gallery.length < 5 && (
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="rounded-sm text-sm" asChild>
                <span>
                  <ImagePlus className="w-4 h-4 mr-2" /> Ajouter
                </span>
              </Button>
              <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" data-testid="gallery-upload" />
            </label>
          )}
        </div>
        {vis.gallery.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {vis.gallery.map((url, i) => (
              <div key={i} className="relative aspect-square bg-surface-2 rounded-md overflow-hidden group">
                <img src={resolveImg(url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeGallery(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-2 rounded-md">
            <ImagePlus className="w-8 h-8 text-ink-3 mx-auto mb-2" />
            <p className="text-sm text-ink-3">Aucune photo pour le moment</p>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-ink-1 hover:bg-primary text-white rounded-sm h-11 px-6"
          data-testid="save-visibility"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Enregistrer</>
          )}
        </Button>
      </div>
    </div>
  );
}
