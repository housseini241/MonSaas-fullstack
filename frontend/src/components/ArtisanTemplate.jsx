import { useEffect, useState, useMemo } from "react";
import * as Lucide from "lucide-react";
import { Phone, Mail, MapPin, Send, Check, ArrowRight, Sparkles } from "lucide-react";
import { resolveImg } from "@/lib/api";
import { siteBasePath } from "@/lib/subdomain";
import { DEFAULT_THEME, ensureGoogleFontsLoaded } from "@/components/ThemePicker";
import { DEFAULT_SECTION_ORDER } from "@/components/SectionsReorder";
import SiteHeader from "@/components/Siteheader";
import SiteFooter from "@/components/Sitefooter";
import BeforeAfterSlider from "@/components/Beforeafterslider";

const Icon = ({ name, className }) => {
  const pascal = (name || "").split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const Cmp = Lucide[pascal] || Sparkles;
  return <Cmp className={className} />;
};

// Neutral placeholders shown until the artisan replaces them with real photos
// (AI image generation is currently disabled — see /sites/generate).
const NEUTRAL_HERO_IMAGE = "https://img.freepik.com/vecteurs-premium/illustration-ouvriers-du-batiment-construisent_961875-4945.jpg";
const NEUTRAL_SERVICE_IMAGE = "https://mass-btp-paris.hustart.fr/api/api/uploads/site-service/03fe65f0-4bbb-4ac3-b41c-3762fd166473/bbd00ff1-35c7-4641-babd-43af00c1d7be.png";
/**
 * ArtisanTemplate: the actual generated artisan website (home page).
 * - Renders content from the AI-generated structure.
 * - Adapts automatically to any number of activities/services (see renderServices).
 * - Optional onSubmitLead callback for the contact form (in builder preview mode, can be no-op).
 * - editable: when true, allows inline editing of certain text fields (used in Builder).
 * - Uses site.theme (colors + fonts) and site.section_order to customize rendering.
 */
export default function ArtisanTemplate({ site, onSubmitLead, editable = false, onEdit, isPreview = false }) {
  const c = site.content || {};
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Toutes");

  const theme = { ...DEFAULT_THEME, ...(site.theme || {}) };
  const sectionOrder = site.section_order && site.section_order.length ? site.section_order : DEFAULT_SECTION_ORDER;

  useEffect(() => {
    ensureGoogleFontsLoaded();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmitLead) return;
    setSending(true);
    try {
      await onSubmitLead(lead);
      setSent(true);
      setLead({ name: "", email: "", phone: "", message: "" });
    } finally {
      setSending(false);
    }
  };

  const Editable = ({ value, field, as: As = "span", className = "" }) => {
    if (!editable) return <As className={className}>{value}</As>;
    return (
      <As
        className={`${className} outline-none focus:bg-[#FEF3C7] focus:ring-2 focus:ring-[var(--site-grad-a)]/40 px-1 -mx-1 rounded transition-colors`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit && onEdit(field, e.currentTarget.textContent)}
      >
        {value}
      </As>
    );
  };

  const heroImage = resolveImg(site.hero_image_url) || NEUTRAL_HERO_IMAGE;
  const serviceImageFallback = NEUTRAL_SERVICE_IMAGE;

  // ---------- Multi-activity / multi-service adaptability ----------
  const services = c.services || [];
  const activities = useMemo(() => {
    const set = [...new Set(services.map((s) => s.activity || site.business_type).filter(Boolean))];
    return set;
  }, [services, site.business_type]);
  const isMultiActivity = activities.length > 1;
  const filteredServices =
    !isMultiActivity || activeFilter === "Toutes" ? services : services.filter((s) => (s.activity || site.business_type) === activeFilter);

  // ---------- Sections (rendered conditionally based on sectionOrder) ----------

  const renderHero = () => (
    <section key="hero" data-testid="section-hero" className="relative pt-14 pb-20 overflow-hidden">
      <div
        className="absolute w-[420px] h-[420px] rounded-full opacity-30 blur-3xl -top-28 -right-24 pointer-events-none"
        style={{ background: "var(--site-grad-a)" }}
        aria-hidden="true"
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-30 blur-3xl -bottom-20 left-[10%] pointer-events-none"
        style={{ background: "var(--site-grad-b)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white border border-[#E4E8F1] px-4 py-2 rounded-full text-[12.5px] font-semibold shadow-[0_10px_30px_rgba(20,25,60,0.08)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--site-grad-a)" }} />
            Devis gratuit · Réponse sous 24h
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {activities.length ? (
              activities.map((a) => (
                <span key={a} className="text-xs font-semibold bg-white border border-[#E4E8F1] px-3.5 py-1.5 rounded-full">
                  {a}
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold bg-white border border-[#E4E8F1] px-3.5 py-1.5 rounded-full">{site.business_type}</span>
            )}
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] font-bold tracking-tight text-[#0F1222]">
            <Editable value={c.hero_title} field="content.hero_title" />
          </h1>
          <p className="mt-5 text-lg text-[#6B7280] leading-relaxed max-w-xl">
            <Editable value={c.hero_subtitle} field="content.hero_subtitle" />
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
            >
              <Editable value={c.hero_cta} field="content.hero_cta" />
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 border-[1.5px] border-[#E4E8F1] bg-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--site-grad-a)] hover:text-[var(--site-grad-a)]"
            >
              <Phone className="w-4 h-4" /> {site.phone}
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden shadow-[0_10px_30px_rgba(20,25,60,0.08)]">
          <img src={heroImage} alt={`${site.business_type} ${site.city}`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute bottom-5 left-5 right-5 bg-white/85 backdrop-blur p-5 rounded-2xl shadow-[0_10px_30px_rgba(20,25,60,0.08)]">
            <div className="text-[13px] font-bold mb-1">Notre engagement</div>
            <div className="text-[12.5px] text-[#6B7280]">Devis clair, délai tenu, chantier propre à la fin de chaque intervention.</div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderServices = () => (
    <section
      key="services"
      id="services"
      data-testid="section-services"
      className="bg-white rounded-[28px] mx-4 md:mx-5 py-16 px-6 md:px-10"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-8 mb-9">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-a)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }} />
              Prestations
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight max-w-lg">Le savoir-faire à votre service</h2>
          </div>
          <p className="text-[#6B7280] max-w-[340px] leading-relaxed">
            Chaque intervention est adaptée à votre besoin réel — pas de forfait générique.
          </p>
        </div>

        {isMultiActivity && (
          <div className="flex flex-wrap gap-2 mb-8" data-testid="activity-filter-tabs">
            {["Toutes", ...activities].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActiveFilter(a)}
                data-testid={`filter-tab-${a}`}
                className={`text-[12.5px] font-semibold px-4.5 py-2.5 rounded-full border transition-colors ${
                  activeFilter === a
                    ? "text-white border-transparent"
                    : "border-[#E4E8F1] hover:border-[var(--site-grad-a)] hover:text-[var(--site-grad-a)]"
                }`}
                style={activeFilter === a ? { background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" } : undefined}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filteredServices.map((s, i) => (
            <article
              key={i}
              className={`bg-[#F4F6FB] rounded-2xl overflow-hidden group transition-transform hover:-translate-y-1 ${isPreview ? "p-6" : ""}`}
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
              <div className={isPreview ? "" : "p-6"}>
                <div className="text-[11px] font-bold mb-2" style={{ color: "var(--site-grad-a)" }}>
                  {(s.activity || site.business_type)} / 0{i + 1}
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{s.name}</h3>
                <p className="text-[13.5px] text-[#6B7280] leading-relaxed">{s.description}</p>
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
      <section key="realisations" id="realisations" data-testid="section-realisations" className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-wrap justify-between items-end gap-8 mb-9">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-a)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }} />
                Nos chantiers
              </div>
              <h2 className="font-display text-4xl font-bold leading-tight max-w-lg">Des réalisations qui parlent d'elles-mêmes</h2>
            </div>
            <p className="text-[#6B7280] max-w-[340px] leading-relaxed">
              Un aperçu des derniers chantiers menés à {site.city} et alentours.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.slice(0, 4).map((r, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden aspect-[3/4] group">
                <img src={resolveImg(r.image_url)} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-[13px] font-semibold">{r.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-9">
            <a
              href={`${siteBasePath(site.slug)}/realisations`}
              className="inline-flex items-center gap-2 border-[1.5px] border-[#E4E8F1] bg-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--site-grad-a)] hover:text-[var(--site-grad-a)]"
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
      <section key="transformation" id="transformation" data-testid="section-transformation" className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="bg-[#0B0F1E] text-white rounded-[28px] py-14 px-6 md:px-10">
            <div className="text-center mb-9">
              <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-b)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--site-grad-b)" }} />
                Transformation
              </div>
              <h2 className="font-display text-4xl font-bold leading-tight max-w-lg mx-auto text-white">Avant / après — glissez pour comparer</h2>
            </div>
            <BeforeAfterSlider beforeUrl={resolveImg(featured.before_url)} afterUrl={resolveImg(featured.after_url)} />
            <div className="flex justify-center mt-9">
              <a
                href={`${siteBasePath(site.slug)}/transformation`}
                className="inline-flex items-center gap-2 text-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderValueProps = () => (
    <section key="value_props" data-testid="section-value-props" className="py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-6">
        {(c.value_props || []).map((vp, i) => (
          <div key={i} className="bg-white rounded-2xl p-7 shadow-[0_10px_30px_rgba(20,25,60,0.08)] transition-transform hover:-translate-y-1" data-testid={`vp-${i}`}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4"
              style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
            >
              <Icon name={vp.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">{vp.title}</h3>
            <p className="text-[13.5px] text-[#6B7280] leading-relaxed">{vp.description}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderAbout = () => (
    <section key="about" id="about" data-testid="section-about" className="py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="bg-[#0B0F1E] text-white rounded-[28px] py-14 px-6 md:px-10 grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-5">
            <div className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-b)" }}>
              À propos
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight text-white">{c.about_title}</h2>
          </div>
          <div className="md:col-span-7">
            <p className="text-[15.5px] leading-relaxed text-[#B6BBD2]">
              <Editable value={c.about_text} field="content.about_text" />
            </p>
            {(site.credentials || []).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {site.credentials.map((cred, i) => (
                  <span key={i} className="text-xs font-semibold border border-[#2A3050] bg-[#171C33] px-4 py-2 rounded-full">
                    {cred}
                  </span>
                ))}
              </div>
            )}
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {(c.why_us || []).map((w, i) => (
                <li key={i} className="text-[13.5px] flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--site-grad-b)" }} />
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
    <section key="process" data-testid="section-process" className="py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-9">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-a)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }} />
            Déroulé
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight">Comment ça se passe</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: 1, title: "Vous décrivez votre besoin", desc: "Par téléphone ou via le formulaire, en 2 minutes." },
            { n: 2, title: "Devis gratuit sous 24h", desc: "Chiffrage clair, sans engagement de votre part." },
            { n: 3, title: "Intervention planifiée", desc: "À la date convenue, travail soigné, chantier propre." },
          ].map((step) => (
            <div key={step.n} className="bg-white rounded-2xl p-7 shadow-[0_10px_30px_rgba(20,25,60,0.08)]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold mb-4"
                style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
              >
                {step.n}
              </div>
              <h3 className="font-display text-[17px] font-bold mb-2">{step.title}</h3>
              <p className="text-[13.5px] text-[#6B7280] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderContact = () => (
    <section key="contact" id="contact" data-testid="section-contact" className="py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--site-grad-a)" }}>
            Contact
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight mb-4">Discutons de votre projet</h2>
          <p className="text-[#6B7280] mb-7">{c.contact_intro}</p>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-[0_10px_30px_rgba(20,25,60,0.08)] flex items-center justify-center">
                <Phone className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
              </div>
              <a href={`tel:${site.phone}`} className="hover:opacity-70">{site.phone}</a>
            </li>
            {site.email && (
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-[0_10px_30px_rgba(20,25,60,0.08)] flex items-center justify-center">
                  <Mail className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
                </div>
                <a href={`mailto:${site.email}`} className="hover:opacity-70">{site.email}</a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-[0_10px_30px_rgba(20,25,60,0.08)] flex items-center justify-center">
                <MapPin className="w-4 h-4" style={{ color: "var(--site-grad-a)" }} />
              </div>
              <span>{site.city} et alentours</span>
            </li>
          </ul>

          {site.show_map && (
            <div className="mt-6 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(20,25,60,0.08)] aspect-video" data-testid="google-map">
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
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-9 rounded-[28px] shadow-[0_10px_30px_rgba(20,25,60,0.08)] space-y-4" data-testid="contact-form">
            {sent ? (
              <div className="text-center py-8">
                <div
                  className="w-14 h-14 text-white rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
                >
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Message envoyé</h3>
                <p className="text-[#6B7280]">Nous vous recontactons rapidement.</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#6B7280] block mb-1.5">Nom complet *</label>
                    <input
                      required
                      value={lead.name}
                      onChange={(e) => setLead({ ...lead, name: e.target.value })}
                      data-testid="lead-name"
                      className="w-full bg-[#F4F6FB] border-[1.5px] border-[#E4E8F1] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#6B7280] block mb-1.5">Téléphone</label>
                    <input
                      value={lead.phone}
                      onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                      data-testid="lead-phone"
                      className="w-full bg-[#F4F6FB] border-[1.5px] border-[#E4E8F1] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    data-testid="lead-email"
                    className="w-full bg-[#F4F6FB] border-[1.5px] border-[#E4E8F1] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1.5">Votre projet *</label>
                  <textarea
                    required
                    rows={4}
                    value={lead.message}
                    onChange={(e) => setLead({ ...lead, message: e.target.value })}
                    data-testid="lead-message"
                    placeholder="Décrivez votre besoin en quelques mots..."
                    className="w-full bg-[#F4F6FB] border-[1.5px] border-[#E4E8F1] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]"
                  />
                </div>
                <label className="flex items-start gap-2.5 text-xs text-[#6B7280]">
                  <input type="checkbox" required className="mt-0.5" data-testid="lead-rgpd" />
                  <span>
                    J'accepte que mes informations soient utilisées pour être recontacté(e) au sujet de ma demande. Voir la{" "}
                    <a href="#" className="underline" style={{ color: "var(--site-grad-a)" }}>politique de confidentialité</a>.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={sending || !onSubmitLead}
                  data-testid="lead-submit"
                  className="w-full text-white px-6 py-4 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))" }}
                >
                  {sending ? "Envoi..." : <>Envoyer ma demande <Send className="w-4 h-4" /></>}
                </button>
                {!onSubmitLead && <p className="text-center text-xs text-[#6B7280]">Aperçu — formulaire désactivé</p>}
              </>
            )}
          </form>
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

  // Theme: two accent colors drive the signature gradient throughout the page.
  const themeCss = `
    .artisan-site{
      --site-grad-a: ${theme.primary_color};
      --site-grad-b: ${theme.accent_color};
      font-family: '${theme.font_body}', 'Inter', sans-serif;
    }
    .artisan-site .font-display{ font-family: '${theme.font_heading}', 'Space Grotesk', sans-serif; }
  `;

  return (
    <div className="artisan-site min-h-screen bg-[#F4F6FB] text-[#0F1222]" data-testid="artisan-template">
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <SiteHeader site={site} activePage="home" isPreview={isPreview} />
      {sectionOrder.map((key) => (SECTIONS[key] ? SECTIONS[key]() : null))}
      <SiteFooter site={site} isPreview={isPreview} />
    </div>
  );
}
