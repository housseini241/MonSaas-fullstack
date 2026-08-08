import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Menu, X } from "lucide-react";
import { resolveImg } from "@/lib/api";
import { siteBasePath } from "@/lib/subdomain";

/**
 * SiteHeader — shared across ArtisanTemplate (home) and the dedicated
 * /realisations and /transformation pages, so nav + branding stay in sync.
 *
 * activePage: "home" | "realisations" | "transformation" — used to highlight
 * the current nav item.
 */
export default function SiteHeader({ site, activePage = "home" }) {
  const [open, setOpen] = useState(false);
  const base = siteBasePath(site.slug);

  const links = [
    { key: "services", label: "Services", href: `${base}#services` },
    { key: "realisations", label: "Réalisations", href: `${base}/realisations` },
    { key: "transformation", label: "Transformations", href: `${base}/transformation` },
    { key: "contact", label: "Contact", href: `${base}#contact` },
  ];

  return (
    <>
      <header className="sticky top-4 z-40 px-4 md:px-5">
        <div className="max-w-6xl mx-auto bg-white/75 backdrop-blur-xl border border-[#E4E8F1] rounded-full px-3 py-2.5 pl-5 flex items-center justify-between shadow-[0_10px_30px_rgba(20,25,60,0.08)]">
          <Link to={base} className="flex items-center gap-3">
            {site.logo_url ? (
              <img
                src={resolveImg(site.logo_url)}
                alt={`${site.business_name} logo`}
                className="w-9 h-9 rounded-full object-contain bg-white border border-[#E4E8F1]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--site-grad-a)] to-[var(--site-grad-b)] flex items-center justify-center text-white font-bold font-display">
                {site.business_name?.charAt(0) || "A"}
              </div>
            )}
            <div>
              <div className="font-display font-bold text-[15px] leading-none">{site.business_name}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                {site.business_type} · {site.city}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.key}
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-[var(--site-grad-a)] ${
                  activePage === l.key ? "text-[var(--site-grad-a)]" : "text-[#0F1222]"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href={`tel:${site.phone}`}
            className="hidden md:flex items-center gap-2 bg-[#0F1222] hover:bg-gradient-to-r hover:from-[var(--site-grad-a)] hover:to-[var(--site-grad-b)] text-white px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(91,95,239,0.22)]"
          >
            <Phone className="w-3.5 h-3.5" /> {site.phone}
          </a>

          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
            className="md:hidden w-9 h-9 rounded-full bg-[#0F1222] text-white flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6" data-testid="mobile-menu">
          <div className="flex items-center justify-between mb-9">
            <div className="font-display font-bold text-lg">{site.business_name}</div>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-[#F4F6FB] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-2xl font-semibold py-3.5 border-b border-[#E4E8F1]"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`tel:${site.phone}`}
            className="mt-7 flex items-center justify-center gap-2 bg-[#0F1222] text-white px-6 py-4 rounded-full font-semibold"
          >
            <Phone className="w-4 h-4" /> Appeler maintenant
          </a>
        </div>
      )}

      {/* Sticky mobile CTA bar */}
      <div className="md:hidden fixed bottom-3.5 left-3.5 right-3.5 z-40 bg-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.15)] p-2 flex gap-2">
        <a
          href={`tel:${site.phone}`}
          className="flex-1 text-center py-3 rounded-full font-bold text-sm bg-[#0F1222] text-white"
        >
          📞 Appeler
        </a>
        <a
          href={`${base}#contact`}
          className="flex-1 text-center py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[var(--site-grad-a)] to-[var(--site-grad-b)]"
        >
          Devis gratuit
        </a>
      </div>
    </>
  );
}
