import { useEffect } from "react";
import { Phone, Mail, MapPin, ArrowRight, Check } from "lucide-react";
import { resolveImg } from "@/lib/api";
import { siteBasePath } from "@/lib/subdomain";
import Icon from "@/templates/shared/Icon";
import EditableText from "@/templates/shared/EditableText";
import useLeadForm from "@/templates/shared/useLeadForm";
import useServiceGrouping from "@/templates/shared/services";
import ContactForm from "@/templates/shared/ContactForm";
import BeforeAfterSlider from "@/components/Beforeafterslider";
import { buildTheme, buildThemeCss, ensureGoogleFontsLoaded } from "@/templates/shared/theme";
import { NEUTRAL_HERO_IMAGE, NEUTRAL_SERVICE_IMAGE, ALL_ACTIVITIES_LABEL } from "@/templates/shared/constants";
import SiteHeader from "@/components/Siteheader";
import SiteFooter from "@/components/Sitefooter";

/**
 * Template 07 — Projet.
 *
 * Portfolio / case-study first: the proof of work comes before the sales copy.
 *
 *  - the realisations section is placed right after the hero, before services;
 *  - the first up-to-3 realisations are rendered as "case studies": an
 *    avant/après pair side by side when a transformation exists for that
 *    position, otherwise a single large photo (graceful fallback);
 *  - a "Demander un devis similaire" CTA follows every case study;
 *  - the remaining realisations fall back to a dense secondary grid;
 *  - the separate `transformation` section only renders the pairs NOT already
 *    used by the case studies, so the same photos are never shown twice.
 *
 * Data sources (already managed elsewhere — only *presentation* lives here):
 *   site.realisations   = [{ id, image_url, title }]
 *   site.transformations = [{ id, title, before_url, after_url }]
 * Case studies pair realisations[i] with transformations[i] by position; that
 * is why the standalone transformation section is offset by the number of
 * case studies rendered.
 */
const INK = "#111827";
const ACCENT = "#0EA5A4";
const MUTED = "#6B7280";
const CANVAS = "#FAFAFA";
const BORDER = "#E5E7EB";
const TINT = "#ECFDFB";

const MAX_CASE_STUDIES = 3;

export default function ProjetTemplate({
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

  const realisations = site.realisations || [];
  const transformations = site.transformations || [];

  const caseStudies = realisations.slice(0, MAX_CASE_STUDIES);
  const galleryItems = realisations.slice(MAX_CASE_STUDIES);
  // Realisations consume transformations[0..n-1] (paired by position), so the
  // standalone transformation section starts after them — no duplicate photos.
  const leftoverTransformations = transformations.slice(caseStudies.length);
  const heroThumbs = realisations.slice(0, 4).map((r) => resolveImg(r.image_url)).filter(Boolean);

  const metaLine = (item) =>
    [item.location || item.city || site.city, item.year].filter(Boolean).join(", ");

  const Kicker = ({ children }) => (
    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: ACCENT }}>
      {children}
    </div>
  );

  const renderHero = () => (
    <section key="hero" data-testid="section-hero" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 border px-4 py-2 rounded-full text-[12.5px] font-semibold mb-6"
            style={{ borderColor: BORDER, color: INK, background: CANVAS }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            Portfolio · Réalisations vérifiables
          </div>

          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] font-bold" style={{ color: INK }}>
            <EditableText value={c.hero_title} field="content.hero_title" editable={editable} onEdit={onEdit} />
          </h1>
          <p className="mt-5 text-lg leading-relaxed max-w-xl" style={{ color: MUTED }}>
            <EditableText value={c.hero_subtitle} field="content.hero_subtitle" editable={editable} onEdit={onEdit} />
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#realisations"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: ACCENT }}
            >
              Voir mes réalisations <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold border transition-colors"
              style={{ borderColor: BORDER, color: INK, background: "#FFFFFF" }}
            >
              <Phone className="w-4 h-4" /> {site.phone}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(heroThumbs.length ? heroThumbs : [heroImage, heroImage, heroImage, heroImage])
            .slice(0, 4)
            .map((src, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: BORDER, aspectRatio: i % 3 === 0 ? "4 / 5" : "1 / 1" }}
              >
                <img src={src} alt="" aria-hidden="true" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
        </div>
      </div>
    </section>
  );

  const renderCaseStudy = (item, index) => {
    const pair = transformations[index];
    return (
      <article
        key={item.id || index}
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: BORDER, background: "#FFFFFF" }}
        data-testid={`case-study-${index}`}
      >
        {pair ? (
          <div className="grid grid-cols-2">
            <div className="relative">
              <img src={resolveImg(pair.before_url)} alt={`${item.title} — avant`} className="w-full h-56 md:h-80 object-cover" loading="lazy" />
              <span
                className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded"
                style={{ background: "rgba(17,24,39,0.75)", color: "#FFFFFF" }}
              >
                Avant
              </span>
            </div>
            <div className="relative">
              <img src={resolveImg(pair.after_url)} alt={`${item.title} — après`} className="w-full h-56 md:h-80 object-cover" loading="lazy" />
              <span
                className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded"
                style={{ background: ACCENT, color: "#FFFFFF" }}
              >
                Après
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <img
              src={resolveImg(item.image_url) || serviceImageFallback}
              alt={item.title}
              className="w-full h-56 md:h-80 object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold truncate" style={{ color: INK }}>
              {item.title || "Réalisation"}
            </h3>
            <p className="text-[13.5px] mt-0.5 truncate" style={{ color: MUTED }}>
              {metaLine(item)}
            </p>
          </div>
          <a
            href="#contact"
            data-testid={`case-study-cta-${index}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white shrink-0 transition-transform hover:-translate-y-0.5"
            style={{ background: ACCENT }}
          >
            Demander un devis similaire <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </article>
    );
  };

  const renderRealisations = () => {
    if (!realisations.length) return null;
    return (
      <section
        key="realisations"
        id="realisations"
        data-testid="section-realisations"
        className="w-full py-16"
        style={{ background: CANVAS, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-10 max-w-2xl">
            <Kicker>Études de cas</Kicker>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight" style={{ color: INK }}>
              {"Des chantiers, des photos, des résultats"}
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              Avant / après et rendu final — la preuve par l'image.
            </p>
          </div>

          <div className="space-y-8">
            {caseStudies.map((item, i) => renderCaseStudy(item, i))}
          </div>

          {galleryItems.length > 0 && (
            <div className="mt-12" data-testid="realisations-grid">
              <div className="t-label mb-3" style={{ color: MUTED }}>
                Autres réalisations
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galleryItems.map((item, i) => (
                  <figure
                    key={item.id || i}
                    className="relative overflow-hidden rounded-xl border group"
                    style={{ borderColor: BORDER }}
                    data-testid={`realisation-thumb-${i}`}
                  >
                    <img
                      src={resolveImg(item.image_url) || serviceImageFallback}
                      alt={item.title}
                      className="w-full h-full object-cover aspect-[3/4] transition-opacity duration-300 group-hover:opacity-90"
                      loading="lazy"
                    />
                    <figcaption
                      className="absolute left-0 right-0 bottom-0 px-3 py-2 text-white text-[12px] font-semibold truncate"
                      style={{ background: "linear-gradient(0deg, rgba(17,24,39,0.85), rgba(17,24,39,0))" }}
                    >
                      {item.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-start mt-10">
            <a
              href={`${siteBasePath(site.slug)}/realisations`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold border transition-colors"
              style={{ borderColor: INK, color: INK, background: "#FFFFFF" }}
            >
              Voir toutes les réalisations <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    );
  };

  const renderServices = () => (
    <section
      key="services"
      id="services"
      data-testid="section-services"
      className="w-full py-16"
      style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Prestations</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: INK }}>
            {"Le savoir-faire à votre service"}
          </h2>
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
                    ? { background: ACCENT, color: "#FFFFFF", borderColor: ACCENT }
                    : { borderColor: BORDER, color: INK, background: "#FFFFFF" }
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
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: BORDER, background: CANVAS }}
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
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: ACCENT }}>
                  {(s.activity || site.business_type)} / 0{i + 1}
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: INK }}>
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

  const renderValueProps = () => (
    <section
      key="value_props"
      data-testid="section-value-props"
      className="w-full py-16"
      style={{ background: TINT, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-6">
        {(c.value_props || []).map((vp, i) => (
          <div key={i} className="rounded-2xl border p-6" style={{ borderColor: BORDER, background: "#FFFFFF" }} data-testid={`vp-${i}`}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4"
              style={{ background: ACCENT }}
            >
              <Icon name={vp.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2" style={{ color: INK }}>
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

  const renderTransformation = () => {
    // Only the pairs not already shown as case studies — avoids duplicates.
    if (!leftoverTransformations.length) return null;
    return (
      <section
        key="transformation"
        id="transformation"
        data-testid="section-transformation"
        className="w-full py-16"
        style={{ background: CANVAS, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-9 max-w-2xl">
            <Kicker>Avant / après</Kicker>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: INK }}>
              Glissez pour comparer
            </h2>
          </div>
          <div className="space-y-10">
            {leftoverTransformations.slice(0, 3).map((item, i) => (
              <div key={item.id || i} data-testid={`transformation-${i}`}>
                <BeforeAfterSlider beforeUrl={resolveImg(item.before_url)} afterUrl={resolveImg(item.after_url)} />
                {item.title && (
                  <p className="mt-3 text-[13.5px] font-semibold" style={{ color: INK }}>
                    {item.title}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-start mt-9">
            <a
              href={`${siteBasePath(site.slug)}/transformation`}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: ACCENT }}
            >
              Voir toutes les transformations <ArrowRight className="w-4 h-4" />
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
      style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-5">
          <Kicker>À propos</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: INK }}>
            {c.about_title}
          </h2>
          {(site.credentials || []).length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {site.credentials.map((cred, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-4 py-2 rounded-full border"
                  style={{ borderColor: BORDER, color: INK }}
                >
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
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(c.why_us || []).map((w, i) => (
              <li key={i} className="text-[14px] flex items-start gap-2" style={{ color: INK }}>
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderProcess = () => (
    <section
      key="process"
      data-testid="section-process"
      className="w-full py-16"
      style={{ background: CANVAS, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <Kicker>Déroulé</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight" style={{ color: INK }}>
            Comment ça se passe
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: 1, title: "Vous décrivez votre besoin", desc: "Par téléphone ou via le formulaire, en 2 minutes." },
            { n: 2, title: "Devis gratuit sous 24h", desc: "Chiffrage clair, sans engagement de votre part." },
            { n: 3, title: "Intervention planifiée", desc: "À la date convenue, travail soigné, chantier propre." },
          ].map((step) => (
            <div key={step.n} className="rounded-2xl border p-6" style={{ borderColor: BORDER, background: "#FFFFFF" }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold mb-4 text-white"
                style={{ background: ACCENT }}
              >
                {step.n}
              </div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: INK }}>
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
    <section key="contact" id="contact" data-testid="section-contact" className="w-full py-16" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Kicker>Contact</Kicker>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: INK }}>
            Discutons de votre projet
          </h2>
          <p className="mb-7 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
            {c.contact_intro}
          </p>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: BORDER, background: CANVAS }}>
                <Phone className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <a href={`tel:${site.phone}`} style={{ color: INK }} className="hover:opacity-70">
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: BORDER, background: CANVAS }}>
                  <Mail className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <a href={`mailto:${site.email}`} style={{ color: INK }} className="hover:opacity-70">
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: BORDER, background: CANVAS }}>
                <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <span style={{ color: INK }}>{site.city} et alentours</span>
            </li>
          </ul>

          {site.show_map && (
            <div className="mt-6 rounded-2xl overflow-hidden aspect-video border" style={{ borderColor: BORDER }} data-testid="google-map">
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
            variant="projet"
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
    realisations: renderRealisations,
    services: renderServices,
    value_props: renderValueProps,
    transformation: renderTransformation,
    about: renderAbout,
    process: renderProcess,
    contact: renderContact,
  };

  const themeCss = buildThemeCss(theme);

  return (
    <div className="artisan-site min-h-screen" style={{ background: CANVAS, color: INK }} data-testid="artisan-template">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="home" isPreview={isPreview} />
      {sectionOrder.map((key) => (SECTIONS[key] ? SECTIONS[key]() : null))}
      <SiteFooter site={site} isPreview={isPreview} />
    </div>
  );
}
