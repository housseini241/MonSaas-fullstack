import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Loader2, Globe, Sparkles, ExternalLink, Pencil,
  Phone, Mail, MapPin, Star, Check, Share2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const publicUrl = (slug) => `${window.location.origin}/site/${slug}`;

function sanitizeDomain(str) {
  return (str || "monsite").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/* ─────────────────────────────────────────
   Mini Artisan Site Preview
   Rendu fidèle à ArtisanTemplate.jsx,
   mis à l'échelle 0.5 dans la carte.
───────────────────────────────────────── */
function MiniSitePreview({ site }) {
  const c = site.content || {};
  const name = site.business_name || "Mon Entreprise";
  const type = site.business_type || "Artisan";
  const city = site.city || "";
  const phone = site.phone || "06 00 00 00 00";
  const heroTitle = c.hero_title || name;
  const heroSub = c.hero_subtitle || `${type} professionnel à ${city}. Devis gratuit sous 48h.`;
  const tagline = c.tagline || `${type} professionnel`;
  const initial = name.charAt(0).toUpperCase();

  const services = c.services?.slice(0, 2) || [
    { name: "Notre expertise", description: "Travail soigné et garantie décennale sur toutes nos interventions." },
    { name: "Entretien régulier", description: "Contrats d'entretien disponibles, réactivité garantie." },
  ];
  const valueProps = c.value_props?.slice(0, 2) || [
    { title: "Garantie décennale", description: "Tous nos travaux sont assurés pour votre tranquillité." },
    { title: "Devis gratuit sous 48h", description: "Réponse rapide et sans engagement." },
  ];
  const whyUs = c.why_us?.slice(0, 4) || ["Travail soigné", "Délais respectés", "Prix transparents", "Éco-responsable"];
  const aboutTitle = c.about_title || `${name}, votre artisan de confiance.`;
  const aboutText = c.about_text || `Entreprise locale spécialisée en ${type.toLowerCase()}, nous intervenons à ${city} et ses environs avec professionnalisme et rigueur.`;

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#F4F6FB" }}>

      {/* Header */}
      <div style={{
        background: "#F4F6FB", borderBottom: "1px solid #E5E1D8",
        padding: "0 16px", height: 48,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: "#0B0F1E",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#F4F6FB", fontFamily: "'Space Grotesk', sans-serif", fontStyle: "italic", fontSize: 14 }}>
              {initial}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontStyle: "italic", fontSize: 14, color: "#111827" }}>
              {name}
            </div>
            {city && (
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#6B7280", marginTop: 1 }}>
                {type} · {city}
              </div>
            )}
          </div>
        </div>
        <div style={{
          background: "#0B0F1E", color: "#F4F6FB",
          padding: "5px 10px", borderRadius: 4,
          fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
        }}>
          <Phone size={9} /> Appeler
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "#F4F6FB", padding: "24px 16px 0" }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0B0F1E", marginBottom: 8 }}>
          — {tagline}
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, lineHeight: 1.1, color: "#111827", marginBottom: 10 }}>
          {heroTitle}
        </div>
        <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.6, marginBottom: 14 }}>
          {heroSub}
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
          <button style={{ background: "#0B0F1E", color: "#fff", padding: "8px 12px", borderRadius: 4, fontSize: 10, fontWeight: 500, border: "none" }}>
            Demander un devis
          </button>
          <button style={{
            background: "transparent", color: "#0B0F1E",
            padding: "7px 12px", borderRadius: 4, fontSize: 10, fontWeight: 500,
            border: "1px solid #0B0F1E", display: "flex", alignItems: "center", gap: 3,
          }}>
            <Phone size={9} /> {phone}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#6B7280", marginBottom: 16 }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#4F46E5" color="#4F46E5" />)}
          <span>Artisan local · Devis gratuit · Garantie décennale</span>
        </div>
        {/* Hero image placeholder */}
        <div style={{
          width: "100%", height: 100, borderRadius: "6px 6px 0 0", overflow: "hidden",
          background: "linear-gradient(135deg, #4F46E5 0%, #7C7FEE 50%, #22D3EE 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Globe size={32} color="rgba(255,255,255,0.4)" />
        </div>
      </div>

      {/* Value props */}
      <div style={{ background: "#EEF0FE", padding: "24px 16px" }}>
        {valueProps.map((vp, i) => (
          <div key={i} style={{ marginBottom: i < valueProps.length - 1 ? 16 : 0 }}>
            <div style={{
              width: 28, height: 28, background: "#0B0F1E", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7,
            }}>
              <Check size={14} color="#F4F6FB" />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#111827", marginBottom: 4 }}>
              {vp.title}
            </div>
            <div style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.5 }}>{vp.description}</div>
          </div>
        ))}
      </div>

      {/* Services */}
      <div style={{ background: "#F4F6FB", padding: "24px 16px" }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0B0F1E", marginBottom: 8 }}>
          — Nos prestations
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: "#111827", marginBottom: 16, lineHeight: 1.15 }}>
          Le savoir-faire <em>à votre service.</em>
        </div>
        {services.map((s, i) => (
          <div key={i} style={{ background: "#EEF0FE", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              width: "100%", height: 70,
              background: i === 0
                ? "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)"
                : "linear-gradient(135deg, #22D3EE 0%, #0EA5C4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Globe size={24} color="rgba(255,255,255,0.3)" />
            </div>
            <div style={{ padding: "14px 14px" }}>
              <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4F46E5", marginBottom: 5 }}>
                Service / 0{i + 1}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: "#111827", marginBottom: 5 }}>
                {s.name}
              </div>
              <div style={{ fontSize: 9, color: "#374151", lineHeight: 1.6 }}>{s.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      <div style={{ background: "#0B0F1E", color: "#F4F6FB", padding: "24px 16px" }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4F46E5", marginBottom: 8 }}>
          — À propos
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: "#F4F6FB", marginBottom: 12, lineHeight: 1.15 }}>
          {aboutTitle}
        </div>
        <div style={{ fontSize: 9, color: "rgba(253,251,247,0.85)", lineHeight: 1.6, marginBottom: 16 }}>
          {aboutText}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {whyUs.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 9, color: "#F4F6FB" }}>
              <Check size={10} color="#4F46E5" style={{ flexShrink: 0, marginTop: 1 }} />
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: "#F4F6FB", padding: "24px 16px" }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0B0F1E", marginBottom: 8 }}>
          — Contact
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: "#111827", marginBottom: 12 }}>
          Discutons de <em>votre projet.</em>
        </div>
        {[
          { Icon: Phone, label: phone },
          { Icon: MapPin, label: `${city} et alentours` },
        ].map(({ Icon: Ic, label }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 11, color: "#1F2937" }}>
            <div style={{
              width: 30, height: 30, background: "#EEF0FE", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Ic size={12} color="#0B0F1E" />
            </div>
            {label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ background: "#111827", color: "#F4F6FB", padding: "28px 16px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontStyle: "italic", fontSize: 18, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 16 }}>{type} professionnel{city ? ` à ${city}` : ""}</div>
        <div style={{ fontSize: 9, color: "#4B5563", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          © 2026 {name} · Site généré avec Hustart
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────
   SiteCard — carte principale avec aperçu
───────────────────────────────────────── */
function SiteCard({ site, onDelete, nav }) {
  const isPublished = site.status === "published";
  const name = site.business_name || "Mon Entreprise";

  const handleShare = () => {
    navigator.clipboard.writeText(publicUrl(site.slug));
    toast.success("Lien copié !");
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md bg-white"
      data-testid={`site-card-${site.id}`}
    >
      {/* ── Mini aperçu scrollable du site artisan ── */}
      <div
        className="relative cursor-pointer"
        style={{ height: 210, overflow: "hidden", background: "#F4F6FB" }}
        onClick={() => window.open(publicUrl(site.slug), "_blank")}
        title="Voir le site"
      >
        {/* Dégradé bas pour l'effet de fondu */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
          style={{ height: 56, background: "linear-gradient(to bottom, transparent, rgba(253,251,247,0.96))" }}
        />

        {/* Mini site mis à l'échelle 0.5 */}
        <div
          style={{
            width: "200%",
            transform: "scale(0.5)",
            transformOrigin: "top left",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <MiniSitePreview site={site} />
        </div>
      </div>

      {/* ── Corps de la carte ── */}
      <div className="px-5 pt-4 pb-5">
        {/* Nom + badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[24px] font-bold text-[#0F1222] leading-tight tracking-tight">
              Bonjour {name}
            </h2>
            {site.business_type && (
              <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-[0.09em] mt-0.5">
                {site.business_type}{site.city ? ` · ${site.city}` : ""}
              </p>
            )}
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0"
            style={{ background: "#EDFAF2", color: "#1A6B35" }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{
                background: "#1A6B35",
                animation: "breathe 2.2s ease-in-out infinite",
              }}
            />
            En ligne
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => window.open(publicUrl(site.slug), "_blank")}
            data-testid={`view-public-${site.id}`}
            data-umami-event="site-view-public"
            className="flex-1 h-12 rounded-2xl text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.97]"
            style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
          >
            <ExternalLink className="w-4 h-4" />
            Voir mon site
          </button>
          <button
            onClick={() => nav(`/builder/${site.id}`)}
            data-testid={`open-builder-${site.id}`}
            className="flex-1 h-12 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition hover:bg-[#E0E7FF] active:scale-[0.97]"
            style={{ background: "#F4F6FB", color: "#0F1222" }}
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </button>

          {/* Partager */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="h-12 w-12 rounded-2xl flex items-center justify-center transition hover:bg-[#E0E7FF] active:scale-95"
                style={{ background: "#F4F6FB", color: "#6B7280" }}
                title="Partager"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Partager ce site</AlertDialogTitle>
                <AlertDialogDescription>
                  Copiez le lien public de votre site : {publicUrl(site.slug)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fermer</AlertDialogCancel>
                <AlertDialogAction onClick={handleShare}>
                  Copier le lien
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Section Modifier — liste verticale
───────────────────────────────────────── */
const EDIT_ITEMS = [
  {
    key: "photos",
    label: "Mes photos",
    desc: "Montrez vos chantiers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: "textes",
    label: "Mes textes",
    desc: "Parlez de votre métier",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    key: "logo",
    label: "Mon logo",
    desc: "Votre signature",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: "coords",
    label: "Me joindre",
    desc: "Téléphone, email",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    key: "adresse",
    label: "Mon atelier",
    desc: "Adresse et horaires",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

function EditSection({ site, nav }) {
  const TAB_MAP = { photos: "design", logo: "design", textes: "content", coords: "settings", adresse: "settings" };
  return (
    <div>
      <h2 className="font-bold text-[20px] text-[#0F1222] tracking-tight mb-3">
        Modifier
      </h2>
      <div className="flex flex-col gap-2.5">
        {EDIT_ITEMS.map(({ key, label, desc, icon }) => (
          <button
            key={key}
            onClick={() => nav(`/builder/${site.id}?tab=${TAB_MAP[key]}`)}
            className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-3.5 text-left transition hover:shadow-md active:scale-[0.98]"
            style={{ border: "1.5px solid transparent", transition: "all 150ms ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#E4E8F1"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
          >
            {/* Icône */}
            <div
              className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: "#EEF0FE", color: "#4F46E5" }}
            >
              {icon}
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[#0F1222] leading-tight">{label}</div>
              <div className="text-[13px] text-[#6B7280] mt-0.5">{desc}</div>
            </div>

            {/* Chevron */}
            <svg
              viewBox="0 0 24 24" fill="none" stroke="#C7CBE0"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Section Nom de domaine
───────────────────────────────────────── */
function DomainSection({ site }) {
  const nav = useNavigate();

  const [input, setInput] = useState(() =>
    sanitizeDomain(site?.custom_domain || site?.business_name)
  );
  const [tld, setTld] = useState(".fr");
  const [reserved, setReserved] = useState(false);

  const domain = `${sanitizeDomain(input)}${tld}`;
  const labelUp = (input || "monsite").toUpperCase();
  const initial = (input || "m").charAt(0).toUpperCase();

  const handleReserve = () => {
    setReserved(true);
    toast.success(`Demande envoyée pour ${domain} !`);
    setTimeout(() => setReserved(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[20px] text-[#0F1222] tracking-tight">
          Nom de domaine
        </h2>
        <button
          onClick={() => nav("/domains")}
          className="text-[11px] font-bold uppercase tracking-[0.07em] transition hover:opacity-70"
          style={{ color: "#4F46E5" }}
        >
          Personnaliser
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #E4E8F1" }}>

        {/* Label */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: "#6B7280" }}>
          Nom de votre entreprise
        </p>

        {/* Input + TLD pills */}
        <div className="flex items-center gap-2 mb-3.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="flex-1 min-w-0 h-[52px] px-4 text-[15px] font-medium outline-none transition"
            style={{
              background: "#EEF0FE",
              borderRadius: 50,
              border: "none",
              color: "#0F1222",
            }}
            placeholder="monsite"
            spellCheck={false}
            autoComplete="off"
          />
          {[".fr", ".com"].map(t => (
            <button
              key={t}
              onClick={() => setTld(t)}
              className="shrink-0 text-[14px] font-bold transition active:scale-95"
              style={{
                width: 54, height: 54, borderRadius: "50%",
                background: tld === t ? "#4F46E5" : "#EEF0FE",
                color: tld === t ? "#fff" : "#4A4F6B",
                border: tld === t ? "none" : "1.5px solid #E4E8F1",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Google preview */}
        <div className="rounded-xl p-3.5 mb-3.5" style={{ background: "#EEF0FE" }}>
          {/* Google logo + search bar */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[15px] font-bold tracking-tight leading-none select-none">
              <span style={{ color: "#4285F4" }}>G</span>
              <span style={{ color: "#EA4335" }}>o</span>
              <span style={{ color: "#FBBC05" }}>o</span>
              <span style={{ color: "#4285F4" }}>g</span>
              <span style={{ color: "#34A853" }}>l</span>
              <span style={{ color: "#EA4335" }}>e</span>
            </span>
            <div
              className="flex-1 min-w-0 h-9 flex items-center gap-2 px-3 text-[13px]"
              style={{
                background: "#fff",
                border: "1px solid #E0DBD4",
                borderRadius: 30,
                color: "#5F6368",
                overflow: "hidden",
              }}
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#9AA0A6" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span className="truncate">{domain}</span>
            </div>
          </div>

          {/* Result */}
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-[15px] mt-0.5"
              style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] mb-0.5 truncate" style={{ color: "#6B7280" }}>
                https://{domain}
              </div>
              <div className="text-[16px] font-medium mb-1 truncate" style={{ color: "#1a73e8" }}>
                {labelUp} — Site officiel
              </div>
              <div className="text-[12px] leading-[1.5]" style={{ color: "#4D5156" }}>
                Découvrez nos services et prenez rendez-vous en ligne. Devis gratuit.
              </div>
            </div>
          </div>
        </div>

        {/* Bouton réserver */}
        <button
          onClick={handleReserve}
          className="w-full flex items-center justify-center gap-2 text-white text-[15px] font-bold transition active:scale-[0.98]"
          style={{
            height: 52,
            borderRadius: 50,
            background: reserved ? "#2D6A4F" : "linear-gradient(120deg, #4F46E5, #22D3EE)",
            border: "none",
            transition: "background 300ms",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {reserved ? "Demande envoyée !" : `Réserver ${domain}`}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Autres sites (liste compacte)
───────────────────────────────────────── */
function OtherSitesList({ sites, activeSiteId, nav }) {
  const others = sites.filter(s => s.id !== activeSiteId);
  if (!others.length) return null;

  return (
    <div>
      <h3 className="font-bold text-[18px] text-[#0F1222] tracking-tight mb-3">
        Autres sites
      </h3>
      <div className="flex flex-col gap-2.5">
        {others.map(s => (
          <div
            key={s.id}
            className="bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ border: "1px solid #E4E8F1" }}
            data-testid={`other-site-${s.id}`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#EEF0FE", color: "#4F46E5", border: "1px solid #E4E8F1" }}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-[#0F1222] truncate">{s.business_name}</div>
              <div className="text-[11px] uppercase tracking-wide truncate" style={{ color: "#6B7280" }}>
                {s.business_type}{s.city ? ` · ${s.city}` : ""}
              </div>
            </div>
            <button
              onClick={() => nav(`/builder/${s.id}`)}
              className="h-8 px-3 rounded-lg text-[13px] font-semibold transition hover:bg-[#E0E7FF] active:scale-95"
              style={{ background: "#EEF0FE", color: "#0F1222", border: "1px solid #E4E8F1" }}
            >
              Modifier
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────── */
export default function Sites() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        api.get("/sites"),
        api.get("/billing/me"),
      ]);
      setSites(r.data);
      setBilling(b.data);
    } catch {
      toast.error("Impossible de charger vos sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeSite = sites.find(s => s.status === "published") || sites[0];

  return (
    <AppShell>
      {/* Animation breathing dot */}
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "#F4F6FB" }}
        data-testid="sites-page"
      >
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">

          {/* Banner plan */}
          {billing && billing.plan !== "pro" && (
            <div
              className="bg-white rounded-2xl px-4 py-4 flex flex-wrap items-center gap-3"
              style={{ border: "1px solid #E4E8F1" }}
            >
              <div className="flex-1 text-sm" style={{ color: "#4A4F6B" }}>
                <span className="font-bold" style={{ color: "#0F1222" }}>
                  {sites.length}/{billing.site_limit} site max.
                </span>
                {" "}— Passez à Pro pour le domaine personnalisé et la boutique.
              </div>
              <button
                onClick={() => nav("/billing")}
                className="h-9 px-4 rounded-xl text-white text-sm font-bold flex items-center gap-1.5 transition hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                data-testid="upgrade-pro-btn"
              >
                <Sparkles className="w-3.5 h-3.5" /> Passer à Pro
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20" style={{ color: "#6B7280" }}>
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
            </div>

          /* Empty state */
          ) : sites.length === 0 ? (
            <div
              className="bg-white rounded-2xl p-12 text-center"
              style={{ border: "1px solid #E4E8F1" }}
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "#EEF0FE", border: "1px solid #E4E8F1", color: "#4F46E5" }}
              >
                <Globe className="w-7 h-7" />
              </div>
              <h2 className="font-bold text-xl mb-2" style={{ color: "#0F1222" }}>
                Aucun site pour le moment.
              </h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                Créez votre premier site en moins de 5 minutes.
              </p>
              <button
                onClick={() => nav("/onboarding")}
                className="h-11 px-6 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                data-testid="empty-create-btn"
              >
                Créer mon premier site
              </button>
            </div>

          ) : (
            <>
              {/* 1. Carte site avec aperçu */}
              <SiteCard site={activeSite} nav={nav} />

              {/* Divider */}
              <div style={{ height: 1, background: "#E4E8F1" }} />

              {/* 2. Raccourcis Modifier */}
              <EditSection site={activeSite} nav={nav} />

              {/* Divider */}
              <div style={{ height: 1, background: "#E4E8F1" }} />

              {/* 3. Nom de domaine */}
              <DomainSection site={activeSite} />

              {/* 4. Autres sites */}
              {sites.length > 1 && (
                <>
                  <div style={{ height: 1, background: "#E4E8F1" }} />
                  <OtherSitesList sites={sites} activeSiteId={activeSite.id} nav={nav} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
