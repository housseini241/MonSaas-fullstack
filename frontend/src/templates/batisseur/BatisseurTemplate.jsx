import { useEffect } from "react";
import { Phone, Mail, MapPin, ArrowRight, Check } from "lucide-react";
import { resolveImg } from "@/lib/api";
import { siteBasePath } from "@/lib/subdomain";
import Icon from "@/templates/shared/Icon";
import EditableText from "@/templates/shared/EditableText";
import useLeadForm from "@/templates/shared/useLeadForm";
import useServiceGrouping from "@/templates/shared/services";
import ContactForm from "@/templates/shared/ContactForm";
import { buildTheme, buildThemeCss, ensureGoogleFontsLoaded } from "@/templates/shared/theme";
import { NEUTRAL_HERO_IMAGE, NEUTRAL_SERVICE_IMAGE, ALL_ACTIVITIES_LABEL } from "@/templates/shared/constants";
import SiteHeader from "@/components/Siteheader";
import SiteFooter from "@/components/Sitefooter";
import BeforeAfterSlider from "@/components/Beforeafterslider";

/**
 * Template 04 — Bâtisseur.
 *
 * Robust, "gros œuvre" identity:
 *  - dark hero section with strong contrast;
 *  - full-width sections, square corners (no border radius anywhere);
 *  - large key figures displayed front-and-centre in the hero.
 * Ideal for maçons, gros œuvre, entreprises générales.
 *
 * Key figures are never invented: they are derived from real site data
 * (number of trades, services, chantiers) or taken from `content.hero_stats`
 * when present, falling back to the 24h-quote promise used across the product.
 */
const INK = "#0F141B";
const STEEL = "#1B222C";
const LIGHT = "#F1F3F5";
const BORDER = "#D7DCE2";
const MUTED = "#5A6675";

export default function BatisseurTemplate({
  site,
  onSubmitLead,
  editable = false,
  onEdit,
  isPreview = false,
  templateDefaults,
  defaultSectionOrder,
}) {
  const c = site.content || {};

  const theme = buildTheme(site.theme, templateDefaults);
  const sectionOrder =
    site.section_order && site.section_order.length ? site.section_order : defaultSectionOrder;

  const { lead, setLead, sent, sending, handleSubmit } = useLeadForm(onSubmitLead);
  const { services, activities, isMultiActivity, activeFilter, setActiveFilter, filteredServices } =
    useServiceGrouping(site);

  useEffect(() => {
    ensureGoogleFontsLoaded();
  }, []);

  const heroImage = resolveImg(site.hero_image_url) || NEUTRAL_HERO_IMAGE;
  const serviceImageFallback = NEUTRAL_SERVICE_IMAGE;

  const realisations = site.realisations || [];

  const heroStats =
    c.hero_stats && c.hero_stats.length
      ? c.hero_stats
      : [
          { value: String(Math.max(activities.length, 1)), label: activities.length > 1 ? "Métiers" : "Métier" },
          ...(services.length ? [{ value: String(services.length), label: "Prestations" }] : []),
          ...(realisations.length ? [{ value: String(realisations.length), label: "Chantiers" }] : []),
          { value: "24h", label: "Devis" },
        ].slice(0, 4);

  const Kicker = ({ children, light = false }) => (
    <div
      className="text-[12px] font-bold uppercase tracking-[0.2em] mb-3"
      style={{ color: light ? "var(--site-grad-b)" : "var(--site-grad-a)" }}
    >
      {children}
    </div>
  );

  const renderHero = () => (
    <section key="hero" data-testid="section-hero" className="relative" style={{ background: INK }}>
      <div className="absolute inset-0">
        <img src={heroImage} alt="" aria-hidden="true" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(15,20,27,0.72) 0%, rgba(15,20,27,0.95) 100%)" }} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-32 pb-12">
        <div className="inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-[12.5px] font-bold uppercase tracking-wider text-white mb-6">
          <span className="w-1.5 h-1.5" style={{ background: "var(--site-grad-b)" }} />
          Devis gratuit · Réponse sous 24h
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {(activities.length ? activities : [site.business_type]).map((a) => (
            <span key={a} className="text-xs font-bold uppercase tracking-wider text-white border border-white/25 px-3.5 py-1.5">
              {a}
            </span>
          ))}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.02] font-bold tracking-tight text-white max-w-4xl uppercase">
          <EditableText value={c.hero_title} field="content.hero_title" editable={editable} onEdit={onEdit} />
        </h1>
        <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: "#C3CBD5" }}>
          <EditableText value={c.hero_subtitle} field="content.hero_subtitle" editable={editable} onEdit={onEdit} />
        </p>
        <div className="mt-9 flex flex-wrap gap-3.5">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-none font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--site-grad-b)", color: "#0B0F14" }}
          >
            <EditableText value={c.hero_cta} field="content.hero_cta" editable={editable} onEdit={onEdit} />
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={`tel:${site.phone}`}
            className="inline-flex items-center gap-2 border-2 border-white/35 text-white px-7 py-4 rounded-none font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Phone className="w-4 h-4" /> {site.phone}
          </a>
        </div>
      </div>

      {/* Key figures — large, full-bleed band */}
      <div className="relative z-10 border-t-2" style={{ borderColor: "var(--site-grad-b)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4">
          {heroStats.map((stat, i) => (
            <div
              key={i}
              className="py-8 px-2 border-white/10"
              style={{ borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.10)" }}
              data-testid={`hero-stat-${i}`}
            >
              <div className="font-display text-5xl md:text-6xl font-bold leading-none text-white">
                {stat.value}
              </div>
              <div className="mt-2 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--site-grad-b)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderServices = () => (
    <section key="services" id="services" data-testid="section-services" className="w-full py-16" style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Prestations</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight uppercase" style={{ color: INK }}>
            Le savoir-faire à votre service
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
            Chaque intervention est adaptée à votre besoin réel — pas de forfait générique.
          </p>
        </div>

        {isMultiActivity && (
          <div className="flex flex-wrap gap-2 mb-8" data-testid="activity-filter-tabs">
            {[ALL_ACTIVITIES_LABEL, ...activities].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActiveFilter(a)}
                data-testid={`filter-tab-${a}`}
                className="text-[12.5px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-none border-2 transition-colors"
                style={
                  activeFilter === a
                    ? { background: "var(--site-grad-b)", color: "#0B0F14", borderColor: "transparent" }
                    : { borderColor: BORDER, color: INK }
                }
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-0 border-t-2" style={{ borderColor: INK, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredServices.map((s, i) => (
            <article
              key={i}
              className="group border-b border-r p-6 bg-white transition-colors hover:bg-[#F7F8F9]"
              style={{ borderColor: BORDER }}
              data-testid={`service-${i}`}
            >
              {!isPreview && (
                <div className="aspect-[4/3] overflow-hidden mb-5">
                  <img
                    src={resolveImg(s.image_url) || serviceImageFallback}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--site-grad-a)" }}>
                {(s.activity || site.business_type)} / 0{i + 1}
              </div>
              <h3 className="font-display text-xl font-bold mb-2 uppercase" style={{ color: INK }}>
                {s.name}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                {s.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderRealisations = () => {
    const items = site.realisations || [];
    if (!items.length) return null;
    return (
      <section key="realisations" id="realisations" data-testid="section-realisations" className="w-full py-16" style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-10 max-w-2xl">
            <Kicker>Nos chantiers</Kicker>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight uppercase" style={{ color: INK }}>
              Des réalisations qui parlent d'elles-mêmes
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              Un aperçu des derniers chantiers menés à {site.city} et alentours.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {items.slice(0, 4).map((r, i) => (
              <div key={i} className="relative aspect-[3/4] group border" style={{ borderColor: BORDER }}>
                <img src={resolveImg(r.image_url)} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F141B]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-[13px] font-bold uppercase tracking-wide">{r.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-start mt-9">
            <a
              href={`${siteBasePath(site.slug)}/realisations`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-none font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
              style={{ background: INK, color: "#fff" }}
            >
              Explorer toutes les réalisations <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    );
  };

  const renderTransformation = () => {
    const items = site.transformations || [];
    if (!items.length) return null;
    const featured = items[0];
    return (
      <section key="transformation" id="transformation" data-testid="section-transformation" className="w-full py-16" style={{ background: STEEL }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-9">
            <Kicker light>Transformation</Kicker>
            <h2 className="font-display text-4xl font-bold leading-tight max-w-xl mx-auto text-white uppercase">
              Avant / après — glissez pour comparer
            </h2>
          </div>
          <BeforeAfterSlider beforeUrl={resolveImg(featured.before_url)} afterUrl={resolveImg(featured.after_url)} />
          <div className="flex justify-center mt-9">
            <a
              href={`${siteBasePath(site.slug)}/transformation`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-none font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--site-grad-b)", color: "#0B0F14" }}
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    );
  };

  const renderValueProps = () => (
    <section key="value_props" data-testid="section-value-props" className="w-full py-16" style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-0">
        {(c.value_props || []).map((vp, i) => (
          <div key={i} className="p-7 border-l-2 first:border-l-0" style={{ borderColor: "var(--site-grad-b)" }} data-testid={`vp-${i}`}>
            <div className="w-12 h-12 flex items-center justify-center mb-4" style={{ background: INK }}>
              <Icon name={vp.icon} className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2 uppercase" style={{ color: INK }}>
              {vp.title}
            </h3>
            <p className="text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
              {vp.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderAbout = () => (
    <section key="about" id="about" data-testid="section-about" className="w-full py-16" style={{ background: INK }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-5">
          <Kicker light>À propos</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-white uppercase">
            {c.about_title}
          </h2>
          {(site.credentials || []).length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {site.credentials.map((cred, i) => (
                <span key={i} className="text-xs font-bold uppercase tracking-wide text-white border border-white/25 px-4 py-2">
                  {cred}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-7">
          <p className="text-[16px] leading-relaxed" style={{ color: "#C3CBD5" }}>
            <EditableText value={c.about_text} field="content.about_text" editable={editable} onEdit={onEdit} />
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {(c.why_us || []).map((w, i) => (
              <li key={i} className="text-[14px] flex items-start gap-2 text-white">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--site-grad-b)" }} />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderProcess = () => (
    <section key="process" data-testid="section-process" className="w-full py-16" style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Déroulé</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight uppercase" style={{ color: INK }}>
            Comment ça se passe
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-0">
          {[
            { n: 1, title: "Vous décrivez votre besoin", desc: "Par téléphone ou via le formulaire, en 2 minutes." },
            { n: 2, title: "Devis gratuit sous 24h", desc: "Chiffrage clair, sans engagement de votre part." },
            { n: 3, title: "Intervention planifiée", desc: "À la date convenue, travail soigné, chantier propre." },
          ].map((step) => (
            <div key={step.n} className="p-8 bg-white border" style={{ borderColor: BORDER }}>
              <div
                className="w-12 h-12 flex items-center justify-center font-display text-xl font-bold mb-4"
                style={{ background: INK, color: "var(--site-grad-b)" }}
              >
                {step.n}
              </div>
              <h3 className="font-display text-xl font-bold mb-2 uppercase" style={{ color: INK }}>
                {step.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderContact = () => (
    <section key="contact" id="contact" data-testid="section-contact" className="w-full py-16" style={{ background: STEEL }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Kicker light>Contact</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4 text-white uppercase">
            Discutons de votre projet
          </h2>
          <p className="mb-7 text-[15.5px] leading-relaxed" style={{ color: "#C3CBD5" }}>
            {c.contact_intro}
          </p>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                <Phone className="w-4 h-4" style={{ color: "var(--site-grad-b)" }} />
              </div>
              <a href={`tel:${site.phone}`} className="text-white hover:opacity-80">
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  <Mail className="w-4 h-4" style={{ color: "var(--site-grad-b)" }} />
                </div>
                <a href={`mailto:${site.email}`} className="text-white hover:opacity-80">
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                <MapPin className="w-4 h-4" style={{ color: "var(--site-grad-b)" }} />
              </div>
              <span className="text-white">{site.city} et alentours</span>
            </li>
          </ul>

          {site.show_map && (
            <div className="mt-6 overflow-hidden aspect-video border" style={{ borderColor: "rgba(255,255,255,0.2)" }} data-testid="google-map">
              <iframe
                title="Carte"
                src={`https://www.google.com/maps?q=${encodeURIComponent(site.map_address || `${site.business_name} ${site.city}`)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
        <div className="md:col-span-7">
          <ContactForm
            variant="batisseur"
            lead={lead}
            setLead={setLead}
            sent={sent}
            sending={sending}
            handleSubmit={handleSubmit}
            onSubmitLead={onSubmitLead}
          />
        </div>
      </div>
    </section>
  );

  const SECTIONS = {
    hero: renderHero,
    services: renderServices,
    realisations: renderRealisations,
    transformation: renderTransformation,
    value_props: renderValueProps,
    about: renderAbout,
    process: renderProcess,
    contact: renderContact,
  };

  const themeCss = buildThemeCss(theme);

  return (
    <div className="artisan-site min-h-screen" style={{ background: LIGHT, color: INK }} data-testid="artisan-template">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="home" isPreview={isPreview} />
      {sectionOrder.map((key) => (SECTIONS[key] ? SECTIONS[key]() : null))}
      <SiteFooter site={site} isPreview={isPreview} />
    </div>
  );
}
