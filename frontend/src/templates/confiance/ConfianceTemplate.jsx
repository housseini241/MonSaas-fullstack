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
 * Template 08 — Confiance.
 *
 * Institutional, reassuring, serious. The single requirement is credibility:
 * everything else is subordinate to it.
 *
 *  - a reassurance band sits directly under the hero (before services);
 *  - navy + grey by default, no bright accent (overridable via ThemePicker);
 *  - the trust/advantage block sits high in the default order, before the gallery;
 *  - no marked animation: colour/opacity transitions only (no parallax, no
 *    translate/scale hovers, no fade-in spectacle);
 *  - the intervention zone gets an explicit, visible panel (never buried).
 * Ideal for BTP, rénovation and entreprise générale.
 *
 * Reassurance figures are never invented: they come from `content.reassurance`
 * when provided, otherwise from real site data (credentials, chantiers) plus
 * the platform-wide "devis gratuit sous 24h" promise. Any element without a
 * value is dropped rather than rendered empty.
 */
const NAVY = "#1E3A5F";
const STEEL = "#4A6B8A";
const MUTED = "#5A6675";
const CANVAS = "#F5F7F9";
const BORDER = "#D7DEE6";
const TINT = "#EEF2F7";

export default function ConfianceTemplate({
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

  const credentials = site.credentials || [];
  const realisations = site.realisations || [];

  // ---- Reassurance band data ----
  const decennaleCredential = credentials.find((cred) =>
    /d[eé]cennale|assurance|garantie/i.test(String(cred)),
  );
  const experienceYears = credentials
    .map((cred) => {
      const match = String(cred).match(/(\d{1,2})\s*(?:ans|ann[eé]es)/i);
      return match ? match[1] : null;
    })
    .find(Boolean);

  const derivedReassurance = [
    ...(experienceYears
      ? [{ icon: "award", value: `${experienceYears} ans`, label: "d'expérience" }]
      : []),
    ...(decennaleCredential
      ? [{ icon: "shield-check", value: "Assurance", label: "décennale" }]
      : []),
    ...(realisations.length
      ? [
          {
            icon: "hammer",
            value: String(realisations.length),
            label: realisations.length > 1 ? "chantiers réalisés" : "chantier réalisé",
          },
        ]
      : []),
    { icon: "file-check", value: "24h", label: "devis gratuit" },
  ];

  const reassuranceSource =
    Array.isArray(c.reassurance) && c.reassurance.length ? c.reassurance : derivedReassurance;
  const reassuranceItems = reassuranceSource
    .filter((item) => item && (item.value || item.label))
    .slice(0, 4);

  // ---- Intervention zone ----
  const zones = Array.isArray(c.intervention_zones)
    ? c.intervention_zones.filter(Boolean)
    : typeof c.service_area === "string" && c.service_area.trim()
      ? c.service_area
          .split(/[,;·|]/)
          .map((zone) => zone.trim())
          .filter(Boolean)
      : [];
  const hasMap = !!site.show_map;

  const Kicker = ({ children, light = false }) => (
    <div
      className="text-[12px] font-semibold uppercase tracking-[0.18em] mb-3"
      style={{ color: light ? STEEL : NAVY }}
    >
      {children}
    </div>
  );

  const renderHero = () => (
    <section key="hero" data-testid="section-hero" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 border px-4 py-2 rounded-[3px] text-[12.5px] font-semibold mb-6"
            style={{ borderColor: BORDER, color: NAVY, background: TINT }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STEEL }} />
            Entreprise vérifiée · Devis gratuit
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {(activities.length ? activities : [site.business_type]).map((a) => (
              <span
                key={a}
                className="text-[11.5px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-[3px] border"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                {a}
              </span>
            ))}
          </div>

          <h1
            className="font-display text-4xl md:text-5xl leading-[1.1] font-bold"
            style={{ color: NAVY }}
          >
            <EditableText value={c.hero_title} field="content.hero_title" editable={editable} onEdit={onEdit} />
          </h1>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: MUTED }}>
            <EditableText value={c.hero_subtitle} field="content.hero_subtitle" editable={editable} onEdit={onEdit} />
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[3px] font-semibold text-white transition-colors"
              style={{ background: NAVY }}
            >
              <EditableText value={c.hero_cta} field="content.hero_cta" editable={editable} onEdit={onEdit} />
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[3px] font-semibold border transition-colors"
              style={{ borderColor: BORDER, color: NAVY, background: "#FFFFFF" }}
            >
              <Phone className="w-4 h-4" /> {site.phone}
            </a>
          </div>

          <p className="mt-6 text-[13px]" style={{ color: MUTED }}>
            Intervention à {site.city} et alentours · Assurance décennale sur nos chantiers
          </p>
        </div>

        <div>
          <div className="overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER }}>
            <img
              src={heroImage}
              alt={`${site.business_type} ${site.city}`}
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
          <div
            className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-[4px] border text-[12.5px]"
            style={{ borderColor: BORDER, color: MUTED, background: CANVAS }}
          >
            <Check className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
            <span>Chantiers propres, délais tenus, finitions contrôlées.</span>
          </div>
        </div>
      </div>
    </section>
  );

  const renderReassurance = () => {
    if (!reassuranceItems.length) return null;
    return (
      <section
        key="reassurance"
        data-testid="section-reassurance"
        className="w-full"
        style={{ background: TINT, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4">
          {reassuranceItems.map((item, i) => (
            <div
              key={i}
              className="py-7 px-4 flex items-center gap-3"
              style={{ borderLeft: i === 0 ? "none" : `1px solid ${BORDER}` }}
              data-testid={`reassurance-${i}`}
            >
              <Icon name={item.icon || "shield-check"} className="w-6 h-6 shrink-0" style={{ color: NAVY }} />
              <div>
                {item.value && (
                  <div className="font-display text-xl font-bold leading-none" style={{ color: NAVY }}>
                    {item.value}
                  </div>
                )}
                <div className="text-[12px] mt-1 leading-snug" style={{ color: MUTED }}>
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderValueProps = () => (
    <section
      key="value_props"
      data-testid="section-value-props"
      className="w-full py-16"
      style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Nos garanties</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: NAVY }}>
            {"Pourquoi nous confier vos travaux"}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(c.value_props || []).map((vp, i) => (
            <div
              key={i}
              className="p-6 rounded-[4px] border"
              style={{ borderColor: BORDER, background: CANVAS }}
              data-testid={`vp-${i}`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-4 border"
                style={{ borderColor: STEEL, background: "#FFFFFF" }}
              >
                <Icon name={vp.icon} className="w-5 h-5" style={{ color: NAVY }} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: NAVY }}>
                {vp.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                {vp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderServices = () => (
    <section
      key="services"
      id="services"
      data-testid="section-services"
      className="w-full py-16"
      style={{ background: CANVAS, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Prestations</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: NAVY }}>
            {"Le savoir-faire à votre service"}
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
            {"Chaque intervention est adaptée à votre besoin réel — pas de forfait générique."}
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
                className="text-[12.5px] font-semibold px-4 py-2.5 rounded-[3px] border transition-colors"
                style={
                  activeFilter === a
                    ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                    : { borderColor: BORDER, color: NAVY, background: "#FFFFFF" }
                }
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredServices.map((s, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-[4px] border"
              style={{ borderColor: BORDER, background: "#FFFFFF" }}
              data-testid={`service-${i}`}
            >
              {!isPreview && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={resolveImg(s.image_url) || serviceImageFallback}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div
                  className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
                  style={{ color: STEEL }}
                >
                  {(s.activity || site.business_type)} / 0{i + 1}
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: NAVY }}>
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
      <section
        key="realisations"
        id="realisations"
        data-testid="section-realisations"
        className="w-full py-16"
        style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-10 max-w-2xl">
            <Kicker>Nos chantiers</Kicker>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: NAVY }}>
              {"Des réalisations qui parlent d'elles-mêmes"}
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              Un aperçu des derniers chantiers menés à {site.city} et alentours.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.slice(0, 4).map((r, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-[4px] aspect-[3/4] border"
                style={{ borderColor: BORDER }}
              >
                <img src={resolveImg(r.image_url)} alt={r.title} className="w-full h-full object-cover" />
                <div
                  className="absolute left-0 right-0 bottom-0 px-3 py-2"
                  style={{ background: "rgba(30,58,95,0.82)" }}
                >
                  <span className="text-white text-[12px] font-semibold">{r.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-start mt-9">
            <a
              href={`${siteBasePath(site.slug)}/realisations`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[3px] font-semibold border transition-colors"
              style={{ borderColor: NAVY, color: NAVY, background: "#FFFFFF" }}
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
      <section
        key="transformation"
        id="transformation"
        data-testid="section-transformation"
        className="w-full py-16"
        style={{ background: TINT, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-9">
            <Kicker>Transformations</Kicker>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight max-w-xl mx-auto" style={{ color: NAVY }}>
              Avant / après — glissez pour comparer
            </h2>
          </div>
          <BeforeAfterSlider beforeUrl={resolveImg(featured.before_url)} afterUrl={resolveImg(featured.after_url)} />
          <div className="flex justify-center mt-9">
            <a
              href={`${siteBasePath(site.slug)}/transformation`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[3px] font-semibold text-white transition-colors"
              style={{ background: NAVY }}
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    );
  };

  const renderAbout = () => (
    <section
      key="about"
      id="about"
      data-testid="section-about"
      className="w-full py-16"
      style={{ background: CANVAS, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-7">
          <Kicker>À propos</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: NAVY }}>
            {c.about_title}
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: MUTED }}>
            <EditableText value={c.about_text} field="content.about_text" editable={editable} onEdit={onEdit} />
          </p>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(c.why_us || []).map((w, i) => (
              <li key={i} className="text-[14px] flex items-start gap-2" style={{ color: NAVY }}>
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: STEEL }} />
                <span>{w}</span>
              </li>
            ))}
          </ul>
          {credentials.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2.5">
              {credentials.map((cred, i) => (
                <span
                  key={i}
                  className="text-[12px] font-semibold px-3.5 py-2 rounded-[3px] border"
                  style={{ borderColor: BORDER, color: NAVY, background: "#FFFFFF" }}
                >
                  {cred}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-5">
          <div className="rounded-[4px] border p-6" style={{ borderColor: BORDER, background: "#FFFFFF" }}>
            <div className="flex items-center gap-2.5 mb-4">
              <Icon name="map-pin" className="w-5 h-5" style={{ color: NAVY }} />
              <h3 className="font-display text-lg font-bold" style={{ color: NAVY }}>
                {"Zone d'intervention"}
              </h3>
            </div>
            <p className="text-[14px] mb-3" style={{ color: MUTED }}>
              {site.city} et alentours
            </p>
            {zones.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="intervention-zones">
                {zones.map((zone, i) => (
                  <span
                    key={i}
                    className="text-[12px] px-3 py-1.5 rounded-[3px]"
                    style={{ background: TINT, color: NAVY }}
                  >
                    {zone}
                  </span>
                ))}
              </div>
            )}
            {hasMap && (
              <div className="mt-5 overflow-hidden rounded-[4px] aspect-video border" style={{ borderColor: BORDER }} data-testid="google-map">
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
        </div>
      </div>
    </section>
  );

  const renderProcess = () => (
    <section
      key="process"
      data-testid="section-process"
      className="w-full py-16"
      style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Déroulé</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: NAVY }}>
            Comment nous travaillons
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: 1, title: "Vous décrivez votre besoin", desc: "Par téléphone ou via le formulaire, en 2 minutes." },
            { n: 2, title: "Devis gratuit sous 24h", desc: "Chiffrage clair, sans engagement de votre part." },
            { n: 3, title: "Intervention planifiée", desc: "À la date convenue, travail soigné, chantier propre." },
          ].map((step) => (
            <div key={step.n} className="p-6 rounded-[4px] border" style={{ borderColor: BORDER }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold mb-4"
                style={{ background: NAVY, color: "#FFFFFF" }}
              >
                {step.n}
              </div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: NAVY }}>
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
    <section
      key="contact"
      id="contact"
      data-testid="section-contact"
      className="w-full py-16"
      style={{ background: CANVAS }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Kicker>Contact</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: NAVY }}>
            Discutons de votre projet
          </h2>
          <p className="mb-7 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
            {c.contact_intro}
          </p>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[3px] flex items-center justify-center border"
                style={{ borderColor: BORDER, background: "#FFFFFF" }}
              >
                <Phone className="w-4 h-4" style={{ color: NAVY }} />
              </div>
              <a href={`tel:${site.phone}`} style={{ color: NAVY }} className="hover:opacity-70">
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[3px] flex items-center justify-center border"
                  style={{ borderColor: BORDER, background: "#FFFFFF" }}
                >
                  <Mail className="w-4 h-4" style={{ color: NAVY }} />
                </div>
                <a href={`mailto:${site.email}`} style={{ color: NAVY }} className="hover:opacity-70">
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[3px] flex items-center justify-center border"
                style={{ borderColor: BORDER, background: "#FFFFFF" }}
              >
                <MapPin className="w-4 h-4" style={{ color: NAVY }} />
              </div>
              <span style={{ color: NAVY }}>{site.city} et alentours</span>
            </li>
          </ul>
        </div>
        <div className="md:col-span-7">
          <ContactForm
            variant="confiance"
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
    reassurance: renderReassurance,
    value_props: renderValueProps,
    services: renderServices,
    realisations: renderRealisations,
    transformation: renderTransformation,
    about: renderAbout,
    process: renderProcess,
    contact: renderContact,
  };

  const themeCss = buildThemeCss(theme);

  return (
    <div
      className="artisan-site min-h-screen"
      style={{ background: CANVAS, color: NAVY }}
      data-testid="artisan-template"
    >
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="home" isPreview={isPreview} />
      {sectionOrder.map((key) => (SECTIONS[key] ? SECTIONS[key]() : null))}
      <SiteFooter site={site} isPreview={isPreview} />
    </div>
  );
}
