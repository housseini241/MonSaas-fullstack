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
 * Template 02 — Atelier.
 *
 * Warm, artisanal identity:
 *  - ivory / beige page background (never pure white);
 *  - full-width hero photo with the text overlaid on top of the image;
 *  - serif headings only (body stays sans-serif) — driven by the template's
 *    default theme tokens (Fraunces headings + Work Sans body).
 * Ideal for menuisiers, peintres, maçons, plombiers.
 */
const INK = "#3E3227";
const MUTED = "#7A6A57";
const IVORY = "#F7F1E7";
const CARD = "#FFFDF8";
const BORDER = "#E7DCCB";

export default function AtelierTemplate({
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
  const { activities, isMultiActivity, activeFilter, setActiveFilter, filteredServices } =
    useServiceGrouping(site);

  useEffect(() => {
    ensureGoogleFontsLoaded();
  }, []);

  const heroImage = resolveImg(site.hero_image_url) || NEUTRAL_HERO_IMAGE;
  const serviceImageFallback = NEUTRAL_SERVICE_IMAGE;

  const Kicker = ({ children, light = false }) => (
    <div
      className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] mb-3"
      style={{ color: light ? "var(--site-grad-b)" : "var(--site-grad-a)" }}
    >
      <span className="w-6 h-px" style={{ background: "currentColor" }} />
      {children}
    </div>
  );

  const renderHero = () => (
    <section key="hero" data-testid="section-hero" className="relative">
      <div className="relative min-h-[80vh] flex items-end overflow-hidden">
        <img
          src={heroImage}
          alt={`${site.business_type} ${site.city}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(43,30,18,0.30) 0%, rgba(43,30,18,0.55) 45%, rgba(43,30,18,0.88) 100%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pb-16 pt-36 w-full">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 px-4 py-2 rounded-full text-[12.5px] font-semibold text-white mb-6">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--site-grad-b)" }} />
            Devis gratuit · Réponse sous 24h
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {(activities.length ? activities : [site.business_type]).map((a) => (
              <span key={a} className="text-xs font-semibold text-white bg-white/10 border border-white/25 px-3.5 py-1.5 rounded-full">
                {a}
              </span>
            ))}
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.02] font-bold tracking-tight text-white max-w-3xl">
            <EditableText value={c.hero_title} field="content.hero_title" editable={editable} onEdit={onEdit} />
          </h1>
          <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: "#F3E9DC" }}>
            <EditableText value={c.hero_subtitle} field="content.hero_subtitle" editable={editable} onEdit={onEdit} />
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[6px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "var(--site-grad-b)", color: "#2B1E14" }}
            >
              <EditableText value={c.hero_cta} field="content.hero_cta" editable={editable} onEdit={onEdit} />
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 border-[1.5px] border-white/40 text-white px-7 py-4 rounded-[6px] font-semibold transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Phone className="w-4 h-4" /> {site.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );

  const renderValueProps = () => (
    <section key="value_props" data-testid="section-value-props" className="py-16" style={{ background: IVORY }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-8">
        {(c.value_props || []).map((vp, i) => (
          <div key={i} className="pt-6 border-t-2" style={{ borderColor: BORDER }} data-testid={`vp-${i}`}>
            <div className="flex items-center gap-3 mb-4">
              <Icon name={vp.icon} className="w-5 h-5" style={{ color: "var(--site-grad-a)" }} />
              <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: MUTED }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold mb-2" style={{ color: INK }}>
              {vp.title}
            </h3>
            <p className="text-[14.5px] leading-relaxed" style={{ color: MUTED }}>
              {vp.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderServices = () => (
    <section key="services" id="services" data-testid="section-services" className="py-16" style={{ background: IVORY }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Prestations</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight" style={{ color: INK }}>
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
                className="text-[12.5px] font-semibold px-4 py-2.5 rounded-full border transition-colors"
                style={
                  activeFilter === a
                    ? { background: "var(--site-grad-a)", color: "#fff", borderColor: "transparent" }
                    : { borderColor: BORDER, color: INK }
                }
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredServices.map((s, i) => (
            <article
              key={i}
              className="group overflow-hidden rounded-[6px] border transition-transform hover:-translate-y-1"
              style={{ background: CARD, borderColor: BORDER }}
              data-testid={`service-${i}`}
            >
              {!isPreview && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={resolveImg(s.image_url) || serviceImageFallback}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--site-grad-a)" }}>
                  {(s.activity || site.business_type)} / 0{i + 1}
                </div>
                <h3 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>
                  {s.name}
                </h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                  {s.description}
                </p>
              </div>
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
      <section key="realisations" id="realisations" data-testid="section-realisations" className="py-16" style={{ background: IVORY }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-10 max-w-2xl">
            <Kicker>Nos chantiers</Kicker>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight" style={{ color: INK }}>
              Des réalisations qui parlent d'elles-mêmes
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              Un aperçu des derniers chantiers menés à {site.city} et alentours.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.slice(0, 4).map((r, i) => (
              <div key={i} className="relative overflow-hidden rounded-[6px] aspect-[3/4] group" style={{ border: `1px solid ${BORDER}` }}>
                <img src={resolveImg(r.image_url)} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B1E14]/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-[13px] font-semibold">{r.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-start mt-9">
            <a
              href={`${siteBasePath(site.slug)}/realisations`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[6px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ border: `1.5px solid ${INK}`, color: INK }}
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
      <section key="transformation" id="transformation" data-testid="section-transformation" className="py-16" style={{ background: IVORY }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="rounded-[6px] py-14 px-6 md:px-12" style={{ background: INK }}>
            <div className="text-center mb-9">
              <Kicker light>Transformation</Kicker>
              <h2 className="font-display text-4xl font-bold leading-tight max-w-lg mx-auto text-white">
                Avant / après — glissez pour comparer
              </h2>
            </div>
            <BeforeAfterSlider beforeUrl={resolveImg(featured.before_url)} afterUrl={resolveImg(featured.after_url)} />
            <div className="flex justify-center mt-9">
              <a
                href={`${siteBasePath(site.slug)}/transformation`}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-[6px] font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--site-grad-b)", color: "#2B1E14" }}
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderAbout = () => (
    <section key="about" id="about" data-testid="section-about" className="py-16" style={{ background: IVORY }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="rounded-[6px] py-14 px-6 md:px-12 grid md:grid-cols-12 gap-10 items-start" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="md:col-span-5">
            <Kicker>À propos</Kicker>
            <h2 className="font-display text-4xl font-bold leading-tight" style={{ color: INK }}>
              {c.about_title}
            </h2>
            {(site.credentials || []).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {site.credentials.map((cred, i) => (
                  <span key={i} className="text-xs font-semibold px-4 py-2 rounded-full" style={{ border: `1px solid ${BORDER}`, color: INK }}>
                    {cred}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-7">
            <p className="text-[16px] leading-relaxed" style={{ color: MUTED }}>
              <EditableText value={c.about_text} field="content.about_text" editable={editable} onEdit={onEdit} />
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {(c.why_us || []).map((w, i) => (
                <li key={i} className="text-[14px] flex items-start gap-2" style={{ color: INK }}>
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--site-grad-a)" }} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderProcess = () => (
    <section key="process" data-testid="section-process" className="py-16" style={{ background: IVORY }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Déroulé</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight" style={{ color: INK }}>
            Comment ça se passe
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { n: 1, title: "Vous décrivez votre besoin", desc: "Par téléphone ou via le formulaire, en 2 minutes." },
            { n: 2, title: "Devis gratuit sous 24h", desc: "Chiffrage clair, sans engagement de votre part." },
            { n: 3, title: "Intervention planifiée", desc: "À la date convenue, travail soigné, chantier propre." },
          ].map((step) => (
            <div key={step.n} className="pt-6 border-t-2" style={{ borderColor: BORDER }}>
              <div className="font-display text-5xl font-bold mb-3" style={{ color: "var(--site-grad-a)" }}>
                {step.n}
              </div>
              <h3 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>
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
    <section key="contact" id="contact" data-testid="section-contact" className="py-16" style={{ background: IVORY }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Kicker>Contact</Kicker>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4" style={{ color: INK }}>
            Discutons de votre projet
          </h2>
          <p className="mb-7 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
            {c.contact_intro}
          </p>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <Phone className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
              </div>
              <a href={`tel:${site.phone}`} style={{ color: INK }} className="hover:opacity-70">
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <Mail className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
                </div>
                <a href={`mailto:${site.email}`} style={{ color: INK }} className="hover:opacity-70">
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <MapPin className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
              </div>
              <span style={{ color: INK }}>{site.city} et alentours</span>
            </li>
          </ul>

          {site.show_map && (
            <div className="mt-6 rounded-[6px] overflow-hidden aspect-video" style={{ border: `1px solid ${BORDER}` }} data-testid="google-map">
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
            variant="atelier"
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
    <div className="artisan-site min-h-screen" style={{ background: IVORY, color: INK }} data-testid="artisan-template">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="home" isPreview={isPreview} />
      {sectionOrder.map((key) => (SECTIONS[key] ? SECTIONS[key]() : null))}
      <SiteFooter site={site} isPreview={isPreview} />
    </div>
  );
}
