import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Phone, Mail, MapPin, Star, Check, 
  Share2, Loader2, Briefcase, ChevronRight, Clock, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { resolveImg } from "@/lib/api";
import { publicSiteUrl } from "@/lib/subdomain";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MarketplaceProfile() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/public/artisans/${slug}`)
      .then((r) => {
        setSite(r.data);
        document.title = `${r.data.business_name} — ${r.data.business_type} · Marketplace HuStart`;
      })
      .catch(() => setError("Artisan introuvable"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center text-center px-6">
        <div>
          <div className="font-serif italic font-light text-5xl text-[#0F1222] mb-3">404</div>
          <p className="text-[#6B7280]">Cet artisan n'existe pas ou n'est plus visible dans l'annuaire.</p>
          <Link to="/marketplace/artisans">
            <Button variant="outline" className="mt-6 rounded-xl">← Retour à l'annuaire</Button>
          </Link>
        </div>
      </div>
    );
  }

  const c = site.content || {};
  const theme = site.theme || {};
  const services = c.services || site.services?.map(s => ({ name: s, description: "" })) || [];

  return (
    <div className="min-h-screen bg-[#F4F6FB]" data-testid="marketplace-profile">
      {/* Mobile CTA fixed bottom */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E4E8F1] p-3 flex gap-2 md:hidden shadow-lg">
        <Link to={`/marketplace/demande?artisan=${slug}`} className="flex-1">
          <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl text-sm">
            Demander un devis
          </Button>
        </Link>
        {site.phone && (
          <a href={`tel:${site.phone}`} className="shrink-0">
            <Button variant="outline" className="rounded-xl text-sm">
              <Phone className="w-4 h-4" />
            </Button>
          </a>
        )}
      </div>

      {/* Header */}
      <header className="border-b border-[#E4E8F1] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/marketplace/artisans" className="flex items-center gap-2 text-[#4A4F6B] hover:text-[#0F1222] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Annuaire</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien copié");
              }}
              className="rounded-xl text-sm"
            >
              <Share2 className="w-4 h-4 mr-2" /> Partager
            </Button>
            <Link
              to={`/marketplace/demande?artisan=${slug}`}
              className="hidden md:inline-flex"
            >
              <Button className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl text-sm">
                Demander un devis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="relative h-48 md:h-72 bg-[#F4F6FB] overflow-hidden">
        {site.hero_image_url ? (
          <img src={resolveImg(site.hero_image_url)} alt={site.business_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
            <Briefcase className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {site.verified && (
                <Badge className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] text-white border-0 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em]">
                  <Check className="w-3 h-3 mr-1" /> Pro vérifié
                </Badge>
              )}
              {site.disponibilite === "disponible" && (
                <Badge className="bg-success text-white border-0 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em]">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1" />
                  Disponible
                </Badge>
              )}
              {site.disponibilite === "conges" && (
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em]">
                  En congés
                </Badge>
              )}
            </div>
            <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-white">
              {site.business_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-white/80 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]">{site.business_type}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {site.city}</span>
              {site.zone_km && (
                <span className="text-white/60">Zone : {site.zone_km} km</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Main column */}
          <div className="md:col-span-8 space-y-8 pb-24 md:pb-10">
            {/* À propos */}
            {c.about_text && (
              <section className="bg-white border border-[#E4E8F1] rounded-2xl p-6 md:p-8">
                <h2 className="font-display font-semibold text-xl tracking-tight text-[#0F1222] mb-4">À propos</h2>
                <p className="text-[#4A4F6B] leading-relaxed">{c.about_text}</p>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section className="bg-white border border-[#E4E8F1] rounded-2xl p-6 md:p-8">
                <h2 className="font-display font-semibold text-xl tracking-tight text-[#0F1222] mb-4">Nos services</h2>
                <div className="grid gap-4">
                  {services.map((svc, i) => (
                    <div key={i} className="border-b border-[#E4E8F1] last:border-0 pb-4 last:pb-0">
                      <h3 className="font-display text-base tracking-tight text-[#0F1222] mb-1">{svc.name}</h3>
                      {svc.description && <p className="text-sm text-[#6B7280] leading-relaxed">{svc.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Galerie réalisations */}
            {site.gallery && site.gallery.length > 0 && (
              <section className="bg-white border border-[#E4E8F1] rounded-2xl p-6 md:p-8">
                <h2 className="font-display font-semibold text-xl tracking-tight text-[#0F1222] mb-4">Réalisations</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {site.gallery.map((url, i) => (
                    <div key={i} className="aspect-square bg-[#F4F6FB] rounded-2xl overflow-hidden">
                      <img src={resolveImg(url)} alt={`Réalisation ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-4 space-y-4">
            {/* Carte de contact sticky */}
            <div className="md:sticky md:top-24 space-y-4">
              {/* Contact card */}
              <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6">
                <h3 className="font-display font-semibold text-lg tracking-tight text-[#0F1222] mb-4">Contact</h3>

                {/* Disponibilité */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E8F1]">
                  <span className="text-sm text-[#4A4F6B]">Disponibilité</span>
                  <span className={`text-sm font-medium flex items-center gap-1.5 ${
                    site.disponibilite === "disponible" ? "text-success" :
                    site.disponibilite === "conges" ? "text-[#6B7280]" : "text-warning"
                  }`}>
                    {site.disponibilite === "disponible" && <><span className="w-2 h-2 bg-success rounded-full" /> Disponible</>}
                    {site.disponibilite === "occupe" && <><Clock className="w-3.5 h-3.5" /> Occupé</>}
                    {site.disponibilite === "conges" && <><ShieldAlert className="w-3.5 h-3.5" /> En congés</>}
                    {!["disponible", "occupe", "conges"].includes(site.disponibilite || "") && (
                      <span className="text-[#6B7280]">Non renseigné</span>
                    )}
                  </span>
                </div>

                {/* Zone */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E8F1]">
                  <span className="text-sm text-[#4A4F6B]">Zone d'intervention</span>
                  <span className="text-sm text-[#0F1222] font-medium">{site.city} {site.zone_km ? `+ ${site.zone_km} km` : ""}</span>
                </div>

                {/* Phone */}
                {site.phone && (
                  <a href={`tel:${site.phone}`} className="flex items-center gap-3 p-3 bg-[#F4F6FB] rounded-2xl hover:bg-[#EEF0FE] transition-colors mb-3 group">
                    <div className="w-9 h-9 bg-[#0F1222] text-white rounded-2xl flex items-center justify-center group-hover:opacity-90 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B7280]">Téléphone</div>
                      <div className="text-sm font-medium text-[#0F1222]">{site.phone}</div>
                    </div>
                  </a>
                )}

                {/* Email */}
                {site.email && (
                  <a href={`mailto:${site.email}`} className="flex items-center gap-3 p-3 bg-[#F4F6FB] rounded-2xl hover:bg-[#EEF0FE] transition-colors mb-4">
                    <div className="w-9 h-9 bg-[#0F1222] text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B7280]">Email</div>
                      <div className="text-sm font-medium text-[#0F1222] truncate">{site.email}</div>
                    </div>
                  </a>
                )}

                <Link to={`/marketplace/demande?artisan=${slug}`}>
                  <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl h-12 text-base">
                    Demander un devis
                  </Button>
                </Link>

                <a href={publicSiteUrl(slug)} target="_blank" rel="noopener noreferrer" className="block mt-3">
                  <Button variant="outline" className="w-full rounded-xl h-11 text-sm" data-testid="view-website">
                    Voir le site web →
                  </Button>
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom CTA */}
        <div className="hidden md:block mt-10 bg-[#0F1222] text-white rounded-2xl p-8 text-center">
          <h3 className="font-display text-2xl tracking-tight mb-2 text-white">
            Vous avez un projet à {site.city} ?
          </h3>
          <p className="text-white/70 mb-6">
            Décrivez votre besoin, {site.business_name} vous répondra sous 24h.
          </p>
          <Link to={`/marketplace/demande?artisan=${slug}`}>
            <Button className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white h-12 px-8 text-base rounded-xl">
              Demander un devis gratuit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
