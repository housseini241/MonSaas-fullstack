import { Link } from "react-router-dom";
import { siteBasePath } from "@/lib/subdomain";
import { toast } from "sonner";

export default function SiteFooter({ site, isPreview = false }) {
  // En preview, le slug n'est pas encore persisté en base : on force base à ""
  // pour que l'ancre #services scroll sur la page courante au lieu de naviguer
  // vers /site/{slug-deviné} → 404.
  const base = isPreview ? "" : siteBasePath(site.slug);

  const LOCKED_IN_PREVIEW = new Set(["realisations", "transformation"]);

  const handleNavClick = (e, link) => {
    if (isPreview && LOCKED_IN_PREVIEW.has(link.key)) {
      e.preventDefault();
      toast.info("Publiez votre site pour voir et modifier cette page");
    }
    // sinon : comportement normal (ancre ou navigation réelle), rien à faire
  };

  return (
    <footer className="bg-[#0B0F1E] text-[#8A90AC] py-14 mt-16 rounded-t-[28px]">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-10 pb-8 border-b border-[#1E2440]">
          <div>
            <div className="font-display font-bold text-xl text-white mb-2">{site.business_name}</div>
            <p className="text-sm max-w-xs leading-relaxed">
              {site.business_type} à {site.city} — intervention rapide, devis gratuit, travail garanti.
            </p>
          </div>
          <div>
            <h4 className="text-white text-[13px] font-bold mb-3.5">Contact</h4>
            <a href={`tel:${site.phone}`} className="block text-[13px] mb-2 hover:text-[var(--site-grad-b)]">{site.phone}</a>
            {site.email && (
              <a href={`mailto:${site.email}`} className="block text-[13px] mb-2 hover:text-[var(--site-grad-b)]">{site.email}</a>
            )}
            <div className="text-[13px]">{site.city}</div>
          </div>
          <div>
            <h4 className="text-white text-[13px] font-bold mb-3.5">Navigation</h4>
            <a
              href={`${base}#services`}
              onClick={(e) => handleNavClick(e, { key: "services" })}
              className="block text-[13px] mb-2 hover:text-[var(--site-grad-b)]"
            >
              Services
            </a>
            <Link
              to={`${base}/realisations`}
              onClick={(e) => handleNavClick(e, { key: "realisations" })}
              className="block text-[13px] mb-2 hover:text-[var(--site-grad-b)]"
            >
              Réalisations
            </Link>
            <Link
              to={`${base}/transformation`}
              onClick={(e) => handleNavClick(e, { key: "transformation" })}
              className="block text-[13px] mb-2 hover:text-[var(--site-grad-b)]"
            >
              Transformations
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 pt-5 text-xs">
          <div>© {new Date().getFullYear()} {site.business_name} — site généré avec Hustart</div>
          <div>
            <a href="#" className="hover:text-[var(--site-grad-b)]">Mentions légales</a>
            <a href="#" className="ml-4 hover:text-[var(--site-grad-b)]">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
