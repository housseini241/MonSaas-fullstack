import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import api, { resolveImg } from "@/lib/api";
import { publicSiteUrl } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Globe, Loader2, Inbox, Save, Phone, Mail, Copy, Check, Image as ImageIcon, X, Plus } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArtisanTemplate from "@/components/ArtisanTemplate";
import ContentEditor from "@/components/ContentEditor";
import ServicesEditor from "@/components/ServicesEditor";
import DomainPanel from "@/components/DomainPanel";
import SectionsReorder, { DEFAULT_SECTION_ORDER } from "@/components/SectionsReorder";
import ThemePicker, { DEFAULT_THEME } from "@/components/ThemePicker";
import RealisationsManager from "@/components/RealisationsManager";
import TransformationsManager from "@/components/TransformationsManager";

export default function Builder() {
  const { siteId } = useParams();
  const nav = useNavigate();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState([]);

  const [copied, setCopied] = useState(false);
  const [uploadingKind, setUploadingKind] = useState(null); // "logo" | "hero" | null
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "preview");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sites/${siteId}`);
      setSite(r.data);
      const lr = await api.get(`/sites/${siteId}/leads`);
      setLeads(lr.data);
    } catch (e) {
      toast.error("Impossible de charger le site");
      nav("/dashboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [siteId]);

  const updateField = (path, value) => {
    setSite((s) => {
      const ns = { ...s };
      if (path.startsWith("content.")) {
        const k = path.slice("content.".length);
        ns.content = { ...ns.content, [k]: value };
      } else {
        ns[path] = value;
      }
      return ns;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/sites/${siteId}`, {
        business_name: site.business_name,
        phone: site.phone,
        email: site.email,
        city: site.city,
        content: site.content,
        services: site.services,
        show_map: site.show_map,
        map_address: site.map_address,
        theme: site.theme,
        section_order: site.section_order,
      });
      toast.success("Modifications enregistrées");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      await api.post(`/sites/${siteId}/publish`);
      setSite((s) => ({ ...s, status: "published" }));
      toast.success("Site publié !");
    } catch (e) {
      toast.error("Erreur de publication");
    }
  };

  const uploadImage = async (file, kind) => {
    setUploadingKind(kind);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    try {
      const r = await api.post(`/sites/${siteId}/upload-image`, fd);
      setSite(r.data);
      toast.success("Image mise à jour");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "logo");
    e.target.value = "";
  };

  const handleHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "hero");
    e.target.value = "";
  };

  const deleteHero = async () => {
    try {
      const r = await api.delete(`/sites/${siteId}/hero-image`);
      setSite((s) => ({ ...s, hero_image_url: r.data.hero_image_url }));
      toast.success("Photo supprimée");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const publicUrl = site ? publicSiteUrl(site.slug) : "";

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("URL copiée");
  };

  if (loading || !site) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="builder-page">
      <header className="border-b border-border bg-surface/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-primary transition-colors"
              data-testid="builder-back"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="Hustart" className="w-7 h-7 rounded-md object-contain shrink-0" />
              <span className="font-display font-semibold text-base tracking-tight text-ink-1 truncate">{site.business_name}</span>
              <span className={[
                "t-label !text-[9px] px-2 py-0.5 rounded-sm",
                site.status === "published" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
              ].join(" ")}>
                {site.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(publicUrl, "_blank")}
              data-testid="builder-view-public"
            >
              <ExternalLink className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">Voir le site</span>
            </Button>
            <Button
              variant="secondary"
              onClick={save}
              disabled={saving}
              size="sm"
              data-testid="builder-save"
            >
              <Save className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">{saving ? "..." : "Enregistrer"}</span>
            </Button>
            <Button onClick={publish} size="sm" data-testid="builder-publish" data-umami-event="site-publish">
              <Globe className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">{site.status === "published" ? "Publié" : "Publier"}</span>
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border bg-surface px-4 md:px-8 overflow-x-auto scrollbar-hide" data-testid="builder-tabs-bar">
          <TabsList className="h-12 bg-transparent rounded-none p-0 gap-1 flex flex-nowrap min-w-max">
            <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-preview">Aperçu</TabsTrigger>
            <TabsTrigger value="content" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-content">Contenu</TabsTrigger>
            <TabsTrigger value="design" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-design">Design</TabsTrigger>
            <TabsTrigger value="domain" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-domain">URL & Domaine</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-settings">Paramètres</TabsTrigger>
            <TabsTrigger value="leads" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap shrink-0" data-testid="tab-leads">
              Leads <span className="ml-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono">{leads.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* PREVIEW */}
        <TabsContent value="preview" className="m-0">
          <div className="bg-surface-2 p-2 md:p-6">
            <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden max-w-7xl mx-auto">
              <div className="bg-background border-b border-border px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
                </div>
                <div className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-xs font-mono text-ink-3 truncate flex items-center justify-between gap-2">
                  <span className="truncate">{publicUrl}</span>
                  <button onClick={copyUrl} className="text-primary hover:text-ink-1 shrink-0" data-testid="copy-url">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="t-label hidden md:block">cliquez sur un texte pour l'éditer</div>
              </div>
              <ArtisanTemplate site={site} editable={true} onEdit={(field, value) => updateField(field, value)} />
            </div>
          </div>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="m-0">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
            <div className="mb-8">
              <h2 className="font-display text-display-l mt-2 text-ink-1">Contenu du site</h2>
              <p className="text-ink-3 mt-2 text-sm">Modifiez chaque section. N'oubliez pas d'enregistrer en haut à droite.</p>
            </div>
            <ContentEditor site={site} setSite={setSite} />
          </div>
        </TabsContent>

        {/* DESIGN */}
        <TabsContent value="design" className="m-0">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-5">
            <div>
              <h2 className="font-display text-display-l mt-2 text-ink-1">Design & visuels</h2>
              <p className="text-ink-3 mt-2 text-sm">Gérez les visuels de votre site.</p>
            </div>

            {/* Logo */}
            <div className="bg-white border border-border p-6 grid md:grid-cols-12 gap-6 items-center" data-testid="design-logo">
              <div className="md:col-span-5">
                <div className="aspect-square w-48 mx-auto md:mx-0 bg-background border border-border overflow-hidden">
                  {site.logo_url ? (
                    <img src={resolveImg(site.logo_url)} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-10 h-10" /></div>
                  )}
                </div>
              </div>
              <div className="md:col-span-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Logo</div>
                <h3 className="font-display font-semibold text-xl tracking-tight mb-2">{site.logo_url ? "Logo actuel" : "Aucun logo"}</h3>
                <p className="text-sm text-muted-foreground mb-4">Importez votre logo depuis vos fichiers ou votre galerie.</p>
                <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoChange} disabled={uploadingKind !== null} data-testid="logo-input" />
                <Button onClick={() => document.getElementById("logo-upload")?.click()} disabled={uploadingKind === "logo"} data-testid="change-logo" className="rounded-sm bg-foreground hover:bg-primary text-white">
                  {uploadingKind === "logo" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )} {uploadingKind === "logo" ? "Envoi..." : "Changer le logo"}
                </Button>
              </div>
            </div>

            {/* Photo principale (Hero) */}
            <div className="bg-white border border-border p-6" data-testid="design-hero">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Photo principale</div>
              <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Hero</h3>
              <p className="text-sm text-muted-foreground mb-4">Grande photo affichée en haut de votre page d'accueil.</p>
              {site.hero_image_url ? (
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-full max-w-md bg-background border border-border overflow-hidden">
                    <img src={resolveImg(site.hero_image_url)} alt="Hero" className="w-full h-48 object-cover" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" className="hidden" id="hero-upload" onChange={handleHeroChange} disabled={uploadingKind !== null} data-testid="hero-input" />
                    <Button variant="outline" onClick={() => document.getElementById("hero-upload")?.click()} disabled={uploadingKind === "hero"} className="rounded-sm" data-testid="change-hero">
                      {uploadingKind === "hero" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )} {uploadingKind === "hero" ? "Envoi..." : "Changer la photo"}
                    </Button>
                    <Button variant="outline" onClick={deleteHero} className="rounded-sm text-destructive" data-testid="delete-hero">
                      <X className="w-4 h-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-full max-w-md h-32 bg-background border border-border flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" className="hidden" id="hero-upload" onChange={handleHeroChange} disabled={uploadingKind !== null} data-testid="hero-input" />
                    <Button variant="outline" onClick={() => document.getElementById("hero-upload")?.click()} disabled={uploadingKind === "hero"} className="rounded-sm" data-testid="change-hero">
                      {uploadingKind === "hero" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )} {uploadingKind === "hero" ? "Envoi..." : "Ajouter une photo"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <ServicesEditor site={site} setSite={setSite} siteId={siteId} />

            {/* Réalisations */}
            <RealisationsManager site={site} onReplace={setSite} />

            {/* Avant / Après */}
            <TransformationsManager site={site} onReplace={setSite} />

            {/* Couleurs & Polices */}
            <div className="bg-white border border-border p-6" data-testid="design-theme">
              <h3 className="font-display font-semibold text-xl tracking-tight mb-1">Couleurs & polices</h3>
              <p className="text-sm text-muted-foreground mb-6">Personnalisez la palette et la typographie de votre site. Les changements apparaissent en direct dans l'aperçu.</p>
              <ThemePicker
                value={site.theme || DEFAULT_THEME}
                onChange={(next) => setSite((s) => ({ ...s, theme: next }))}
              />
            </div>

            {/* Ordre des sections */}
            <div className="bg-white border border-border p-6" data-testid="design-sections">
              <h3 className="font-display font-semibold text-xl tracking-tight mb-1">Ordre des sections</h3>
              <p className="text-sm text-muted-foreground mb-5">Glissez-déposez pour réorganiser l'ordre des sections sur votre site (en-tête et pied de page restent fixes).</p>
              <SectionsReorder
                value={site.section_order || DEFAULT_SECTION_ORDER}
                onChange={(next) => setSite((s) => ({ ...s, section_order: next }))}
              />
            </div>
          </div>
        </TabsContent>

        {/* DOMAIN */}
        <TabsContent value="domain" className="m-0">
          <DomainPanel site={site} setSite={setSite} />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="m-0">
          <div className="max-w-3xl mx-auto px-6 py-12">
            <h2 className="font-display font-semibold text-3xl tracking-tight mb-8">Paramètres du site</h2>
            <div className="space-y-5 bg-white border border-border p-8">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Nom de l'entreprise</label>
                <Input data-testid="settings-business-name" value={site.business_name} onChange={(e) => updateField("business_name", e.target.value)} className="h-12 rounded-sm border-border" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Téléphone</label>
                  <Input data-testid="settings-phone" value={site.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-12 rounded-sm border-border" />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Ville</label>
                  <Input data-testid="settings-city" value={site.city} onChange={(e) => updateField("city", e.target.value)} className="h-12 rounded-sm border-border" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Email (pour recevoir les notifications de leads)</label>
                <Input data-testid="settings-email" value={site.email || ""} onChange={(e) => updateField("email", e.target.value)} className="h-12 rounded-sm border-border" placeholder="contact@votre-entreprise.fr" />
              </div>

              {/* Google Maps */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Carte Google Maps</label>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="checkbox" id="show-map" checked={!!site.show_map} onChange={(e) => updateField("show_map", e.target.checked)} className="w-4 h-4 accent-[#F95A2C]" data-testid="settings-show-map" />
                  <label htmlFor="show-map" className="text-sm text-[#374151]">Afficher une carte sur la page contact</label>
                </div>
                {site.show_map && (
                  <Input data-testid="settings-map-address" value={site.map_address || ""} onChange={(e) => updateField("map_address", e.target.value)} className="h-12 rounded-sm border-border" placeholder={`ex: 12 rue Lafayette, ${site.city}`} />
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">URL du site, sous-domaine ou domaine personnalisé</span>
                <button onClick={() => document.querySelector('[data-testid="tab-domain"]')?.click()} className="text-primary underline underline-offset-4 hover:text-foreground" data-testid="settings-go-to-domain">
                  Onglet "URL & Domaine" →
                </button>
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slug</div>
                  <div className="font-display font-semibold text-sm truncate">{site.slug}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Statut</div>
                  <div className="font-display font-semibold text-sm">{site.status}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Style</div>
                  <div className="font-display font-semibold text-sm">{site.style}</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* LEADS */}
        <TabsContent value="leads" className="m-0">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display font-semibold text-3xl tracking-tight">Demandes de contact</h2>
                <p className="text-muted-foreground mt-1">{leads.length} {leads.length > 1 ? "leads reçus" : "lead reçu"}</p>
              </div>
            </div>
            {leads.length === 0 ? (
              <div className="bg-white border border-border p-16 text-center">
                <div className="w-14 h-14 bg-background border border-border mx-auto mb-5 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Aucun lead pour le moment</h3>
                <p className="text-muted-foreground text-sm">Partagez l'URL de votre site pour commencer à recevoir des demandes.</p>
                <div className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs">
                  {publicUrl}
                  <button onClick={copyUrl} className="text-primary">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((l) => (
                  <div key={l.id} className="bg-white border border-border p-5" data-testid={`lead-${l.id}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-display font-semibold">{l.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{new Date(l.created_at).toLocaleString("fr-FR")}</div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="w-3.5 h-3.5" /> {l.email}</a>
                        {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3.5 h-3.5" /> {l.phone}</a>}
                      </div>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed border-t border-border/60 pt-3">{l.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
