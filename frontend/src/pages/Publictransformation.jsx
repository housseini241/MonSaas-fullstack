import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { resolveImg } from "@/lib/api";
import SiteHeader from "@/components/Siteheader";
import SiteFooter from "@/components/Sitefooter";
import SiteSkeleton from "@/components/Siteskeleton";
import BeforeAfterSlider from "@/components/Beforeafterslider";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PublicTransformation() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/public/sites/${slug}`)
      .then((r) => {
        setSite(r.data);
        document.title = `Transformations — ${r.data.business_name}`;
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

  const items = site.transformations || [];
  const themeCss = `
    .artisan-site{ --site-grad-a: ${site.theme?.primary_color || "#5B5FEF"}; --site-grad-b: ${site.theme?.accent_color || "#22D3EE"}; }
  `;

  return (
    <div className="artisan-site min-h-screen bg-[#F4F6FB] text-[#0F1222]">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="transformation" />

      <section className="pt-12 pb-5">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <Link to={`/site/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[var(--site-grad-a)] mb-5">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <div className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-b)" }}>Avant / Après</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Nos transformations</h1>
          <p className="mt-3.5 text-[#6B7280] max-w-xl">
            Faites glisser chaque curseur pour comparer l'état initial et le résultat final de nos chantiers.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-14">
          {items.length === 0 ? (
            <div className="border border-dashed border-[#E4E8F1] rounded-2xl py-16 text-center text-[#6B7280]" data-testid="transformations-empty">
              Aucune transformation ajoutée pour le moment.
            </div>
          ) : (
            items.map((t, i) => (
              <BeforeAfterSlider
                key={i}
                beforeUrl={resolveImg(t.before_url)}
                afterUrl={resolveImg(t.after_url)}
                caption={t.title}
              />
            ))
          )}
        </div>
      </section>

      <SiteFooter site={site} />
    </div>
  );
}
