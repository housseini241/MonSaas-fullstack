import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";
import { ArrowRight, Check, Phone, Sparkles } from "lucide-react";
import { fetchAppSettings } from "@/lib/settings";
import { resolveImg } from "@/lib/api";

const Icon = ({ name, className }) => {
  const pascal = (name || "").split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const Cmp = Lucide[pascal] || Sparkles;
  return <Cmp className={className} />;
};

/* ---------- Header flottant, arrondi ---------- */
function Nav({ s }) {
  return (
    <header className="sticky top-4 z-50 px-4">
      <div className="max-w-5xl mx-auto bg-white/75 backdrop-blur-xl border border-[#E4E8F1] rounded-full pl-3 pr-1.5 sm:pl-4 sm:pr-2 py-1.5 sm:py-2 flex items-center justify-between gap-2 shadow-[0_8px_24px_rgba(20,25,60,0.07)]" data-testid="landing-nav">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0" data-testid="logo-link">
          <img src="/logo.png" alt="Hustart" className="w-8 h-8 shrink-0 object-contain" />
          <span className="font-display font-bold text-[15px] tracking-tight truncate">{s.brand?.name || "HuStart"}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {(s.navbar?.items || []).map((it, i) => (
            <a key={i} href={it.href} className="text-[13.5px] font-medium text-[#3A3F55] hover:text-[#4F46E5] transition-colors">
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link to="/login" className="hidden sm:block">
            <button type="button" className="text-[13.5px] font-semibold leading-none px-4 py-2.5 rounded-full hover:bg-[#F4F6FB] transition-colors whitespace-nowrap" data-testid="nav-login">
              {s.navbar?.cta_login || "Se connecter"}
            </button>
          </Link>
          <Link to="/signup">
            <button
              type="button"
              className="text-[13px] sm:text-[13.5px] font-semibold leading-none px-4 sm:px-5 py-2.5 rounded-full bg-[#0F1222] text-white whitespace-nowrap transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)] hover:bg-gradient-to-r hover:from-[#4F46E5] hover:to-[#22D3EE]"
              data-testid="nav-signup"
            >
              {s.navbar?.cta_signup || "Commencer"}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero 1 : sélecteur de profil (Pro vs Marketplace) ---------- */
function HeroProfileSelector({ s, onSelectPro }) {
  return (
    <section className="relative pt-14 pb-10 px-4 overflow-hidden" data-testid="hero-profile-selector">
      <div className="absolute w-[360px] h-[360px] rounded-full bg-[#4F46E5] opacity-[0.28] blur-[70px] -top-24 -right-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute w-[260px] h-[260px] rounded-full bg-[#22D3EE] opacity-[0.28] blur-[70px] -bottom-14 left-[6%] pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#0F1222]">
          Trouvez plus de clients
          <br />
          <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">ou le bon professionnel.</span>
        </h1>
        <p className="mt-4 text-base text-[#666B85] max-w-md mx-auto">Choisissez votre profil pour commencer.</p>

        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onSelectPro}
            data-testid="hero-card-pro"
            className="group flex-1 flex items-center gap-4 p-6 bg-white border-[1.5px] border-[#E4E8F1] rounded-[20px] text-left cursor-pointer shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-all hover:-translate-y-1 hover:border-[#4F46E5]/40"
          >
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg mb-1.5">Je suis un artisan</div>
              <p className="text-[10.5px] text-[#666B85] leading-relaxed">Créez votre site web en 5 minutes grâce à l'IA.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#4F46E5] shrink-0 transition-transform group-hover:translate-x-1" />
          </button>

          <Link
            to="/marketplace"
            data-testid="hero-card-marketplace"
            className="group flex-1 flex items-center gap-4 p-6 bg-white border-[1.5px] border-[#E4E8F1] rounded-[20px] text-left cursor-pointer shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-all hover:-translate-y-1 hover:border-[#4F46E5]/40"
          >
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg mb-1.5">Je cherche un artisan</div>
              <p className="text-[10.5px] text-[#666B85] leading-relaxed">Devis gratuits · Comparez plusieurs artisans.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#4F46E5] shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Hero 2 : artisan (après sélection du profil "pro") ---------- */
function HeroArtisan({ s, onBack }) {
  const hero = s.hero || {};
  return (
    <section className="relative pt-6 pb-10 px-4 overflow-hidden" data-testid="hero-artisan">
      <div className="absolute w-[360px] h-[360px] rounded-full bg-[#4F46E5] opacity-[0.28] blur-[70px] -top-24 -right-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute w-[260px] h-[260px] rounded-full bg-[#22D3EE] opacity-[0.28] blur-[70px] -bottom-14 left-[6%] pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <button
          type="button"
          onClick={onBack}
          data-testid="hero-back-btn"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#666B85] hover:text-[#0F1222] transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Retour
        </button>

        <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.14] tracking-tight text-[#0F1222]">
          {hero.title_line_1 || "Le site internet de votre métier,"}{" "}
          <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">
            {hero.title_italic || "prêt avant votre café"}
          </span>
        </h1>
        <p className="mt-4 text-base text-[#666B85] max-w-lg mx-auto leading-relaxed">
          {hero.subtitle || "Décrivez votre activité. Hustart rédige vos textes, optimise votre visibilité locale et crée un site professionnel — prêt à montrer à vos clients."}
        </p>

        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <Link to="/signup">
            <button
              type="button"
              data-testid="hero-cta-primary"
              data-umami-event="landing-cta-hero"
              className="inline-flex items-center gap-2 text-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
              style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
            >
              {hero.cta_primary || "Créer mon site gratuitement"} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <a href="#how">
            <button
              type="button"
              data-testid="hero-cta-secondary"
              className="inline-flex items-center gap-2 bg-white border-[1.5px] border-[#E4E8F1] px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5 hover:border-[#4F46E5] hover:text-[#4F46E5]"
            >
              {hero.cta_secondary || "Voir comment ça marche"}
            </button>
          </a>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2.5 flex-wrap">
          {(hero.trust_chips || ["Sans carte bancaire", "Visible sur Google et l'annuaire Hustart", "Modifiable à tout moment"]).map((chip, i) => (
            <span key={i} className="text-xs font-semibold text-[#666B85] bg-white border border-[#E4E8F1] px-3.5 py-1.5 rounded-full">
              {chip}
            </span>
          ))}
        </div>
      </div>

      {hero.preview_img && (
        <div className="relative z-10 max-w-4xl mx-auto mt-11 rounded-[26px] overflow-hidden border border-[#E4E8F1] shadow-[0_16px_36px_rgba(79,70,229,0.22)]">
          <img src={resolveImg(hero.preview_img)} alt="Aperçu d'un site généré par Hustart" className="w-full block" />
        </div>
      )}
    </section>
  );
}

/* ---------- Page Landing principale ---------- */
export default function Landing() {
  const [s, setS] = useState(null);
  const [audience, setAudience] = useState(null);

  useEffect(() => {
    fetchAppSettings().then(setS).catch(() => setS({}));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".ls-reveal:not(.in-view)").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [s, audience]);

  if (!s) return <div className="min-h-screen bg-[#F4F6FB]" />;

  const how = s.how_it_works || {};
  const features = s.features || {};
  const pricing = s.pricing || {};
  const free = pricing.free || {};
  const pro = pricing.pro || {};
  const footerCta = s.footer_cta || {};
  const footer = s.footer || {};
  const trades = s.marquee_trades || [];
  const testimonials = s.testimonials?.length ? s.testimonials : s.testimonial?.author ? [s.testimonial] : [];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1222] overflow-x-hidden" data-testid="landing-page">
      <style>{`
        .ls-reveal{opacity:0; transform:translateY(18px); transition:opacity .55s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1);}
        .ls-reveal.in-view{opacity:1; transform:translateY(0);}
        .ls-reveal-group .ls-reveal:nth-child(2){transition-delay:.08s;}
        .ls-reveal-group .ls-reveal:nth-child(3){transition-delay:.16s;}
        .ls-reveal-group .ls-reveal:nth-child(4){transition-delay:.24s;}
        @keyframes ls-scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .ls-marquee{animation:ls-scroll 24s linear infinite;}
        @media (prefers-reduced-motion: reduce){
          .ls-reveal{opacity:1!important; transform:none!important;}
          .ls-marquee{animation:none!important;}
          *{transition-duration:.01ms!important; animation-duration:.01ms!important;}
        }
      `}</style>

      <Nav s={s} />

      {audience === null ? (
        <HeroProfileSelector s={s} onSelectPro={() => setAudience("pro")} />
      ) : (
        <HeroArtisan s={s} onBack={() => setAudience(null)} />
      )}

      {/* MARQUEE des métiers */}
      {trades.length > 0 && (
        <div className="overflow-hidden py-5 border-y border-[#E4E8F1] mt-10">
          <div className="flex gap-3.5 w-max ls-marquee">
            {[...trades, ...trades].map((t, i) => (
              <span key={i} className="text-[13px] font-semibold text-[#666B85] bg-white border border-[#E4E8F1] px-4 py-2 rounded-full whitespace-nowrap">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* COMMENT ÇA MARCHE */}
      <section id="how" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-11">
            {how.kicker && (
              <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#4F46E5] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" /> {how.kicker}
              </div>
            )}
            <h2 className="font-display text-3xl font-bold leading-tight">{how.title_line_1 || "De l'idée au site en ligne"}</h2>
            <p className="mt-3 text-[#666B85]">{how.subtitle || "Pas de code. Pas de template à choisir. Pas d'agence à attendre."}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 ls-reveal-group">
            {(how.steps || [
              { n: 1, title: "Vous répondez à quelques questions", description: "Métier, ville, services, téléphone. Quelques champs simples, c'est tout." },
              { n: 2, title: "Votre site est prêt tout seul", description: "Textes, mise en page, tout est fait pour vous — en moins d'une minute." },
              { n: 3, title: "Vos clients vous trouvent", description: "Formulaire de contact intégré, demandes centralisées dans votre tableau de bord." },
            ]).map((step) => (
              <div key={step.n} className="ls-reveal bg-white rounded-[18px] p-7 shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-transform hover:-translate-y-1" data-testid={`step-${step.n}`}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-sm mb-3.5"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  {step.n}
                </div>
                <h3 className="font-display font-bold text-base mb-1.5">{step.title}</h3>
                <p className="text-[13.5px] text-[#666B85] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-11">
            {features.kicker && (
              <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#4F46E5] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" /> {features.kicker}
              </div>
            )}
            <h2 className="font-display text-3xl font-bold leading-tight">{features.title_line_1 || "Tout ce qu'il vous faut. Rien de plus."}</h2>
            <p className="mt-3 text-[#666B85]">{features.subtitle || "Fait pour un artisan, pas pour un informaticien."}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 ls-reveal-group">
            {(features.items?.length
              ? features.items
              : [
                  { icon: "layout-grid", title: "Soyez visible", description: "Site professionnel + présence sur l'annuaire Hustart, sans effort de votre part." },
                  { icon: "check-check", title: "Ne perdez plus un seul client", description: "Devis, clients, rendez-vous : tout au même endroit, sur votre téléphone." },
                  { icon: "zap", title: "Soyez en règle sans y penser", description: "Facture électronique conforme à l'obligation 2026, incluse — pas d'outil en plus à acheter.", highlight: true },
                  { icon: "puzzle", title: "Fait pour un artisan", description: "Tout se modifie en 2 clics. Aucune compétence technique requise." },
                ]
            ).map((f, i) => (
              <div
                key={i}
                data-testid={`feature-${i}`}
                className={`ls-reveal rounded-[18px] p-7 shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-transform hover:-translate-y-1 ${
                  f.highlight ? "bg-[#0B0F1E] text-white" : "bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${f.highlight ? "bg-white/10 text-white" : "text-white"}`}
                  style={f.highlight ? undefined : { background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  <Icon name={f.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-[16.5px] mb-1.5">{f.title}</h3>
                <p className={`text-[13.5px] leading-relaxed ${f.highlight ? "text-[#A9AFC7]" : "text-[#666B85]"}`}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-lg mx-auto mb-11">
              <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#4F46E5] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" /> Ils nous font confiance
              </div>
              <h2 className="font-display text-3xl font-bold leading-tight">Ce qu'en disent nos artisans</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 ls-reveal-group">
              {testimonials.slice(0, 3).map((t, i) => (
                <div key={i} className="ls-reveal bg-white rounded-[18px] p-6 shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-transform hover:-translate-y-1" data-testid={`testimonial-${i}`}>
                  {t.rating && (
                    <div className="flex gap-0.5 mb-3" style={{ color: "#4F46E5" }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} className={`w-3.5 h-3.5 ${j < t.rating ? "fill-current" : "fill-[#E4E8F1]"}`} viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  <p className="text-[13.5px] leading-relaxed text-[#33364A] mb-4">{t.quote}</p>
                  <div>
                    <b className="text-[13px] block">{t.author}</b>
                    <span className="text-xs text-[#666B85]">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TARIFS */}
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-11">
            <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#4F46E5] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" /> Tarifs
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight">Simple. Sans surprise.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 ls-reveal-group">
            <div className="ls-reveal bg-white rounded-[26px] p-8 border-[1.5px] border-[#E4E8F1] shadow-[0_8px_24px_rgba(20,25,60,0.07)] transition-transform hover:-translate-y-1">
              <div className="text-xs font-bold uppercase tracking-wide text-[#666B85] mb-3.5">{free.label || "Gratuit"}</div>
              <div className="font-display text-[42px] font-bold mb-1">
                {free.price || "0€"} <span className="text-sm font-medium text-[#666B85]">{free.period || "/mois"}</span>
              </div>
              <p className="text-[13.5px] text-[#666B85] mb-6">{free.tagline || "Pour démarrer sans rien payer."}</p>
              <ul className="mb-6 space-y-2.5">
                {(free.features || ["Votre site en ligne, prêt en quelques minutes", "Visible sur l'annuaire Hustart", "Demandes clients reçues directement", "Jusqu'à 3 devis par mois"]).map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px]">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#4F46E5" }} /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <button type="button" data-testid="pricing-free-cta" className="w-full py-3.5 rounded-full font-semibold text-sm border-[1.5px] border-[#0F1222] transition-colors hover:bg-[#0F1222] hover:text-white">
                  {free.cta || "Démarrer gratuitement"}
                </button>
              </Link>
            </div>

            <div className="ls-reveal relative bg-[#0B0F1E] text-white rounded-[26px] p-8 shadow-[0_16px_36px_rgba(79,70,229,0.22)] transition-transform hover:-translate-y-1">
              {pro.badge && (
                <span
                  className="absolute -top-3 right-7 text-white text-[11px] font-bold px-3.5 py-1 rounded-full"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  {pro.badge}
                </span>
              )}
              <div className="text-xs font-bold uppercase tracking-wide text-[#A9AFC7] mb-3.5">{pro.label || "Pro"}</div>
              <div className="font-display text-[42px] font-bold mb-1">
                {pro.price || "19€"} <span className="text-sm font-medium text-[#A9AFC7]">{pro.period || "/mois"}</span>
              </div>
              <p className="text-[13.5px] text-[#A9AFC7] mb-6">{pro.tagline || "Pour ne plus rien perdre."}</p>
              <ul className="mb-6 space-y-2.5">
                {(pro.features || ["Devis et factures illimités", "Facture électronique conforme (obligation 2026)", "Votre propre nom de domaine", "Agenda et rendez-vous clients", "Mise en avant prioritaire + support prioritaire"]).map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px]">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22D3EE" }} /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <button
                  type="button"
                  data-testid="pricing-pro-cta"
                  data-umami-event="landing-cta-pricing"
                  className="w-full py-3.5 rounded-full font-semibold text-sm text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  {pro.cta || "Passer au Pro"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="px-4 pb-6">
        <div className="ls-reveal max-w-5xl mx-auto bg-[#0B0F1E] text-white rounded-[26px] py-14 px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight text-white">
            {footerCta.title_line_1 || "Votre vitrine, votre gestion, votre tranquillité."}
            <br />
            <span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">{footerCta.title_italic || "Avant le café."}</span>
          </h2>
          <Link to="/signup">
            <button
              type="button"
              data-testid="footer-cta"
              className="mt-6 inline-flex items-center gap-2 text-white px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
            >
              {footerCta.button_label || "Commencer gratuitement"} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-4 py-7 flex flex-wrap justify-between gap-2.5 text-xs text-[#666B85]">
        <div>{footer.copyright || `© ${new Date().getFullYear()} Hustart · fait en France`}</div>
        <div className="flex gap-5">
          <span>{footer.version || "v2.0.0"}</span>
          <span>{footer.status || "opérationnel"}</span>
        </div>
      </footer>
    </div>
  );
}
