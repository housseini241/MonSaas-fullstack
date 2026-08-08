import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { resolveImg } from "@/lib/api";
import { siteBasePath } from "@/lib/subdomain";
import SiteHeader from "@/components/Siteheader";
import SiteFooter from "@/components/Sitefooter";
import SiteSkeleton from "@/components/Siteskeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PublicRealisations({ slug: slugProp } = {}) {
  const { slug: paramSlug } = useParams();
  const slug = slugProp || paramSlug;
  const [site, setSite] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/public/sites/${slug}`)
      .then((r) => {
        setSite(r.data);
        document.title = `Réalisations — ${r.data.business_name}`;
      })
      .catch(() => setError("Site introuvable"));
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center text-center px-6">
        <div>
          <div className="font-display font-bold text-5xl mb-3">404</div>
          <p className="text-[#6B7280]">Ce site n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }
  if (!site) return <SiteSkeleton />;

  const items = site.realisations || [];
  const themeCss = `
    .artisan-site{ --site-grad-a: ${site.theme?.primary_color || "#5B5FEF"}; --site-grad-b: ${site.theme?.accent_color || "#22D3EE"}; }
  `;

  return (
    <div className="artisan-site min-h-screen bg-[#F4F6FB] text-[#0F1222]">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="realisations" />

      <section className="pt-12 pb-5">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <Link to={siteBasePath(slug) || "/"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[var(--site-grad-a)] mb-5">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <div className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-a)" }}>Portfolio</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Toutes nos réalisations</h1>
          <p className="mt-3.5 text-[#6B7280] max-w-xl">
            Chaque chantier, petit ou grand, mérite le même niveau de finition. Voici un aperçu de nos interventions récentes à {site.city} et alentours.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {items.length === 0 ? (
            <div className="border border-dashed border-[#E4E8F1] rounded-2xl py-16 text-center text-[#6B7280]" data-testid="realisations-empty">
              Aucune réalisation ajoutée pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="realisations-grid">
              {items.map((r, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden aspect-[3/4] group">
                  <img src={resolveImg(r.image_url)} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-[13px] font-semibold">{r.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter site={site} />
    </div>
  );
}
