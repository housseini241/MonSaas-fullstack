import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════════════════
   DONNÉES — 50 métiers BTP + services associés
══════════════════════════════════════════════════════════ */

const TRADES = [
  { id: "Plomberie",            label: "Plombier" },
  { id: "Électricité",          label: "Électricien" },
  { id: "Chauffage",            label: "Chauffagiste" },
  { id: "Climatisation",        label: "Climaticien" },
  { id: "Menuiserie",           label: "Menuisier" },
  { id: "Charpente",            label: "Charpentier" },
  { id: "Couverture",           label: "Couvreur-Zingueur" },
  { id: "Maçonnerie",           label: "Maçon" },
  { id: "Carrelage",            label: "Carreleur" },
  { id: "Peinture",             label: "Peintre" },
  { id: "Plâtrerie",            label: "Plaquiste-Plâtrier" },
  { id: "Serrurerie",           label: "Serrurier-Métallier" },
  { id: "Vitrerie",             label: "Vitrier-Miroitier" },
  { id: "Sols",                 label: "Solier" },
  { id: "Façade",               label: "Façadier" },
  { id: "Étanchéité",           label: "Étancheur" },
  { id: "Piscine",              label: "Pisciniste" },
  { id: "Isolation",            label: "Isolation thermique" },
  { id: "Pompe à chaleur",      label: "Installateur PAC" },
  { id: "Photovoltaïque",       label: "Panneaux solaires" },
  { id: "Domotique",            label: "Domotique-Alarme" },
  { id: "Cuisine",              label: "Cuisiniste" },
  { id: "Salle de bain",        label: "Salle de bain" },
  { id: "Rénovation",           label: "Rénovation globale" },
  { id: "Ébénisterie",          label: "Ébéniste-Agenceur" },
  { id: "Paysagiste",           label: "Paysagiste" },
  { id: "Jardinage",            label: "Jardinier-Élagage" },
  { id: "Terrassement",         label: "Terrassier" },
  { id: "Ramoneur",             label: "Ramoneur" },
  { id: "Nettoyage",            label: "Nettoyage après chantier" },
  { id: "IRVE",                 label: "Installateur borne IRVE" },
  { id: "Frigoriste",           label: "Frigoriste" },
  { id: "Technicien CVC",       label: "Technicien CVC" },
  { id: "Échafaudeur",          label: "Échafaudeur" },
  { id: "Désamiantage",         label: "Désamianteur" },
  { id: "Coffreur",             label: "Coffreur-bancheur" },
  { id: "Ferrailleur",          label: "Ferrailleur" },
  { id: "Canalisateur",         label: "Canalisateur VRD" },
  { id: "Fibre optique",        label: "Monteur fibre optique" },
  { id: "Menuiserie alu",       label: "Menuisier aluminium" },
  { id: "Menuiserie PVC",       label: "Menuisier PVC" },
  { id: "Storiste",             label: "Storiste" },
  { id: "Charpente métallique", label: "Charpentier métallique" },
  { id: "Ascensoriste",         label: "Ascensoriste" },
  { id: "Automaticien",         label: "Automaticien portail" },
  { id: "Courant faible",       label: "Courant faible" },
  { id: "Sol résine",           label: "Solier résine" },
  { id: "Béton décoratif",      label: "Béton décoratif" },
  { id: "Géothermie",           label: "Géothermie" },
  { id: "Dépanneur",            label: "Dépanneur multitechnique" },
];

const SERVICES_BY_TRADE = {
  Plomberie:            ["Dépannage urgent", "Installation sanitaire", "Rénovation salle de bain", "Détection de fuite", "Débouchage"],
  Électricité:          ["Mise aux normes", "Installation tableau", "Domotique", "Éclairage", "Dépannage"],
  Maçonnerie:           ["Construction mur", "Rénovation façade", "Fondations", "Dallage", "Ravalement"],
  Peinture:             ["Peinture intérieure", "Peinture extérieure", "Ravalement", "Papier peint", "Enduits décoratifs"],
  Menuiserie:           ["Pose de portes", "Parquet", "Fenêtres", "Terrasse bois", "Mobilier sur mesure"],
  Chauffage:            ["Installation chaudière", "Pompe à chaleur", "Radiateurs", "Plancher chauffant", "Entretien annuel"],
  Couverture:           ["Réfection toiture", "Zinguerie", "Isolation combles", "Nettoyage toit", "Gouttières"],
  Carrelage:            ["Pose carrelage sol", "Faïence salle de bain", "Terrasse", "Joint", "Devis gratuit"],
  Paysagiste:           ["Création jardin", "Entretien pelouse", "Taille haies", "Arrosage auto", "Plantation"],
  Serrurerie:           ["Ouverture porte", "Blindage", "Installation serrure", "Vitrine", "Urgence 24h/24"],
  Plâtrerie:            ["Cloisons", "Isolation", "Enduits", "Faux plafond", "Ravalement"],
  Rénovation:           ["Rénovation complète", "Salle de bain", "Cuisine", "Isolation", "Gros œuvre"],
  Climatisation:        ["Installation clim", "Entretien", "Dépannage", "VMC", "Pompe à chaleur"],
  Jardinage:            ["Tonte pelouse", "Taille arbres", "Désherbage", "Entretien", "Nettoyage"],
  Nettoyage:            ["Après chantier", "Remise en état", "Vitres", "Fin de chantier", "Débarras"],
  Charpente:            ["Charpente traditionnelle", "Ossature bois", "Traitement", "Surélévation", "Lamellé-collé"],
  Vitrerie:             ["Vitrage", "Double vitrage", "Dépannage", "Miroiterie", "Véranda"],
  Sols:                 ["Parquet", "Sol PVC", "Moquette", "Ragréage", "Ponçage vitrification"],
  Façade:               ["Ravalement", "Enduit", "ITE", "Nettoyage façade", "Peinture"],
  Étanchéité:           ["Toiture terrasse", "Balcon", "Cuvelage", "Membrane EPDM", "Recherche fuite"],
  Piscine:              ["Construction", "Rénovation liner", "Local technique", "Entretien", "Pompe"],
  Isolation:            ["Combles perdus", "ITI", "ITE", "Phonique", "Soufflage"],
  "Pompe à chaleur":    ["PAC air-eau", "PAC air-air", "Entretien", "Dépannage", "Désembouage"],
  Photovoltaïque:       ["Panneaux solaires", "Autoconsommation", "Installation", "Onduleur", "Maintenance"],
  Domotique:            ["Alarme", "Vidéosurveillance", "Motorisation portail", "Maison connectée", "Interphone"],
  Cuisine:              ["Conception", "Pose", "Plan de travail", "Électroménager", "Rénovation"],
  "Salle de bain":      ["Douche italienne", "Baie", "Carrelage", "Plomberie", "Meuble vasque"],
  Ébénisterie:          ["Agencement", "Dressing", "Bibliothèque", "Restauration", "Sur mesure"],
  Terrassement:         ["Terrassement", "VRD", "Assainissement", "Tranchée", "Empierrement"],
  Ramoneur:             ["Ramonage", "Poêle à bois", "Cheminée", "Conduit", "Attestation"],
  Autre:                [],
  IRVE:                 ["Installation borne", "Mise aux normes IRVE", "Dépannage borne", "Audit électrique", "Maintenance"],
  Frigoriste:           ["Installation clim pro", "Chambre froide", "Pompe à chaleur", "Entretien fluides", "Dépannage froid"],
  "Technicien CVC":     ["Maintenance CVC", "Régulation", "Traitement d'air", "Désembouage", "Optimisation énergétique"],
  Échafaudeur:          ["Montage échafaudage", "Sécurisation chantier", "Location", "Démontage", "Étude plan"],
  Désamiantage:         ["Diagnostic amiante", "Retrait amiante", "Confinement", "Décontamination", "Évacuation déchets"],
  Coffreur:             ["Coffrage", "Béton armé", "Dalle", "Voile béton", "Banches"],
  Ferrailleur:          ["Ferraillage", "Armatures", "Pose treillis", "Ligature", "Préfa"],
  Canalisateur:         ["Pose réseaux", "Assainissement", "Tranchée", "Raccordement", "VRD"],
  "Fibre optique":      ["Tirage fibre", "Raccordement FTTH", "Soudure", "Test réflectométrie", "Dépannage"],
  "Menuiserie alu":     ["Fenêtre alu", "Baie coulissante", "Véranda", "Porte alu", "Mur rideau"],
  "Menuiserie PVC":     ["Fenêtre PVC", "Porte PVC", "Volet roulant", "Rénovation", "Double vitrage"],
  Storiste:             ["Store banne", "Volet roulant", "Pergola", "Motorisation", "Dépannage"],
  "Charpente métallique": ["Ossature acier", "Charpente métallique", "Bardage", "Soudure", "Montage"],
  Ascensoriste:         ["Installation ascenseur", "Modernisation", "Dépannage", "Maintenance", "Mise aux normes"],
  Automaticien:         ["Motorisation portail", "Porte automatique", "Barrière", "Interphone vidéo", "Dépannage"],
  "Courant faible":     ["Alarme", "Vidéosurveillance", "Contrôle d'accès", "Interphonie", "Domotique"],
  "Sol résine":         ["Résine époxy", "Sol industriel", "Ragréage", "Étanchéité", "Décoratif"],
  "Béton décoratif":    ["Béton ciré", "Béton imprimé", "Béton désactivé", "Chape", "Rénovation"],
  Géothermie:           ["Forage", "PAC géothermique", "Capteurs", "Entretien", "Étude"],
  Dépanneur:            ["Dépannage urgent", "Multiservices", "Petits travaux", "Maintenance", "Astuce"],
};

/* ══════════════════════════════════════════════════════════
   TOKENS & HELPERS
══════════════════════════════════════════════════════════ */

const C = {
  canvas:  "#F4F6FB",
  surface: "#FFFFFF",
  ink:     "#0F1222",
  ink2:    "#4A4F6B",
  ink3:    "#8A90AC",
  amber:   "#4F46E5",
  amberBg: "#EEF0FE",
  border:  "#E4E8F1",
  green:   "#2D6A4F",
  greenBg: "#D8EFDF",
  error:   "#B53A2E",
  gradA:   "#4F46E5",
  gradB:   "#22D3EE",
};
const GRADIENT = `linear-gradient(120deg, ${C.gradA}, ${C.gradB})`;

const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/* ══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
══════════════════════════════════════════════════════════ */

function ProgressBar({ step, total }) {
  return (
    <div style={{ height: 4, background: C.border, borderRadius: 9999, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.round((step / total) * 100)}%`,
        background: GRADIENT,
        borderRadius: 9999,
        transition: "width 400ms cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

function StepLabel({ step, total }) {
  const labels = ["Votre métier", "Vos services", "Vos infos"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {step}/{total}
      </span>
      <span style={{ fontSize: 12, color: C.ink3, fontWeight: 500 }}>
        — {labels[step - 1]}
      </span>
    </div>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9999, background: C.ink, color: "#fff", fontSize: 13, fontWeight: 600 }}>
      {label}
      <button type="button" onClick={onRemove} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 0, fontSize: 15, lineHeight: 1 }}>×</button>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   ÉTAPE 1 — Métier (multi-sélection + recherche sticky)
══════════════════════════════════════════════════════════ */

function Step1({ data, set }) {
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);
  const searchStickyRef = useRef(null);
  const mainRef = useRef(null);
  const headerRef = useRef(null);

  const q = normalize(search.trim()).slice(0, 5);
  const filtered = TRADES.filter((t) => {
    if (!q) return true;
    return normalize(t.label).startsWith(q) || normalize(t.id).startsWith(q);
  });

  const toggle = (id) => {
    const cur = data.business_types;
    set("business_types", cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  /* ── Floating search bar on scroll ── */
  useEffect(() => {
    const onScroll = () => {
      const el = searchStickyRef.current;
      if (!el) return;
      if (window.scrollY > 120) {
        el.classList.add("is-floating");
      } else {
        el.classList.remove("is-floating");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Mobile keyboard: push search bar up ── */
  const positionForKeyboard = useCallback(() => {
    const el = searchStickyRef.current;
    const hdr = headerRef.current;
    if (!el || !hdr) return;
    document.body.classList.add("ob-keyboard-open");
    el.classList.add("is-floating");
    const hdrH = hdr.getBoundingClientRect().height;
    const y = el.getBoundingClientRect().top + window.pageYOffset - hdrH - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
    if (mainRef.current) mainRef.current.style.paddingBottom = "380px";
  }, []);

  useEffect(() => {
    const inp = searchRef.current;
    if (!inp) return;
    inp.style.fontSize = "16px"; // prevent iOS zoom

    const onFocus = () => {
      setTimeout(positionForKeyboard, 50);
      setTimeout(positionForKeyboard, 300);
    };
    const onBlur = () => {
      document.body.classList.remove("ob-keyboard-open");
      if (mainRef.current) mainRef.current.style.paddingBottom = "";
    };
    inp.addEventListener("focus", onFocus);
    inp.addEventListener("blur", onBlur);

    if (window.visualViewport) {
      const vv = window.visualViewport;
      const onVV = () => {
        if (!document.body.classList.contains("ob-keyboard-open")) return;
        const kbH = window.innerHeight - vv.height;
        if (kbH > 60 && mainRef.current) {
          mainRef.current.style.paddingBottom = (kbH + 180) + "px";
          positionForKeyboard();
        }
      };
      vv.addEventListener("resize", onVV);
      vv.addEventListener("scroll", onVV);
      return () => {
        inp.removeEventListener("focus", onFocus);
        inp.removeEventListener("blur", onBlur);
        vv.removeEventListener("resize", onVV);
        vv.removeEventListener("scroll", onVV);
      };
    }
    return () => {
      inp.removeEventListener("focus", onFocus);
      inp.removeEventListener("blur", onBlur);
    };
  }, [positionForKeyboard]);

  return (
    <div ref={mainRef} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header ref invisible pour calcul scroll */}
      <div ref={headerRef} style={{ display: "none" }} />

      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1.25, margin: "0 0 8px", color: C.ink }}>
          Quel est votre métier ?
        </h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: 0, lineHeight: 1.6 }}>
          Vous pouvez choisir <strong style={{ color: C.ink }}>plusieurs activités</strong> si besoin.
        </p>
      </div>

      {/* Nom entreprise */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Nom de votre entreprise</label>
        <input
          value={data.business_name}
          onChange={(e) => set("business_name", e.target.value)}
          placeholder="Ex : Dupont Plomberie, Martin & Fils…"
          data-testid="ob-business-name"
          autoComplete="off"
          spellCheck={false}
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
        <span style={{ fontSize: 12, color: C.ink3 }}>Ce sera le titre principal de votre site.</span>
      </div>

      {/* Barre de recherche sticky */}
      <div
        ref={searchStickyRef}
        id="ob-search-sticky"
        style={{
          position: "sticky",
          top: 58,
          zIndex: 35,
          padding: "8px 0 12px",
          marginBottom: 4,
          background: "rgba(244,246,251,0.92)",
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
          transition: "backdrop-filter 250ms ease, box-shadow 250ms ease",
        }}
      >
        <style>{`
          #ob-search-sticky.is-floating {
            backdrop-filter: blur(14px) !important;
            -webkit-backdrop-filter: blur(14px) !important;
            background: rgba(244,246,251,0.88) !important;
            box-shadow: 0 4px 16px rgba(26,23,20,0.08) !important;
            padding: 10px 0 14px !important;
          }
        `}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Rechercher votre activité BTP</label>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tapez plombier, électricien, carreleur…"
            data-testid="ob-search-trade"
            autoComplete="off"
            spellCheck={false}
            style={{ ...inputStyle, height: 48 }}
            onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* Grille métiers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: C.ink3, fontSize: 14 }}>
            Aucun métier trouvé.
          </div>
        )}
        {filtered.map((t) => {
          const active = data.business_types.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              data-testid={`trade-${t.id}`}
              style={{
                padding: "12px 10px", borderRadius: 18,
                border: `2px solid ${active ? C.amber : C.border}`,
                background: active ? C.amberBg : C.surface,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 150ms ease",
                transform: active ? "scale(1.02)" : "scale(1)",
                minHeight: 46, position: "relative", width: "100%",
                fontSize: 14, fontWeight: 600, color: active ? C.amber : C.ink2,
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", top: 5, right: 5,
                  width: 16, height: 16, borderRadius: "50%",
                  background: C.amber, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700,
                }}>✓</div>
              )}
              <span style={{ textAlign: "center", lineHeight: 1.3 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tags sélectionnés */}
      {data.business_types.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.business_types.map((id) => {
            const t = TRADES.find((x) => x.id === id);
            return <Tag key={id} label={t?.label || id} onRemove={() => toggle(id)} />;
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ÉTAPE 2 — Services
══════════════════════════════════════════════════════════ */

function Step2({ data, set }) {
  const [custom, setCustom] = useState("");

  const suggestions = [...new Set(
    data.business_types.flatMap((id) => SERVICES_BY_TRADE[id] || [])
  )];

  const toggleService = (s) => {
    if (data.services.includes(s)) {
      set("services", data.services.filter((x) => x !== s));
    } else if (data.services.length < 6) {
      set("services", [...data.services, s]);
    }
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v || data.services.length >= 6 || data.services.includes(v)) return;
    set("services", [...data.services, v]);
    setCustom("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1.25, margin: "0 0 8px", color: C.ink }}>
          Quels services proposez-vous ?
        </h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: 0, lineHeight: 1.6 }}>
          Choisissez jusqu'à <strong style={{ color: C.ink }}>6 services</strong>. Chacun aura sa section sur votre site.
        </p>
      </div>

      {/* Champ custom */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Ajouter un service personnalisé</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Ex : Rénovation salle de bain…"
            data-testid="ob-service-input"
            autoComplete="off"
            style={{ ...inputStyle, flex: 1, height: 48 }}
            onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!custom.trim() || data.services.length >= 6}
            data-testid="ob-add-service"
            style={{ height: 48, padding: "0 16px", borderRadius: 9999, background: GRADIENT, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: (!custom.trim() || data.services.length >= 6) ? 0.4 : 1 }}
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Suggestions pour {data.business_types.join(", ")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map((s) => {
              const active = data.services.includes(s);
              const full = !active && data.services.length >= 6;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !full && toggleService(s)}
                  data-testid={`suggest-${s}`}
                  style={{
                    padding: "9px 14px", borderRadius: 9999,
                    border: `1.5px solid ${active ? C.amber : C.border}`,
                    background: active ? C.amberBg : C.surface,
                    color: active ? C.amber : full ? C.ink3 : C.ink,
                    fontSize: 13.5, fontWeight: active ? 700 : 500,
                    cursor: full ? "not-allowed" : "pointer",
                    transition: "all 150ms ease", opacity: full ? 0.5 : 1,
                  }}
                >
                  {active && <span style={{ marginRight: 4 }}>✓</span>}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags sélectionnés */}
      {data.services.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            <span>Sélectionnés</span><span>({data.services.length}/6)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.services.map((s) => (
              <Tag key={s} label={s} onRemove={() => toggleService(s)} data-testid={`service-tag-${s}`} />
            ))}
          </div>
        </div>
      )}

      {data.services.length === 0 && (
        <div style={{ padding: 16, borderRadius: 16, background: C.amberBg, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, color: C.amber, fontWeight: 600, margin: 0 }}>
            👆 Choisissez au moins 1 service ci-dessus
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ÉTAPE 3 — Contact
══════════════════════════════════════════════════════════ */

function Step3({ data, set, errors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1.25, margin: "0 0 8px", color: C.ink }}>
          Comment vous contacter ?
        </h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: 0, lineHeight: 1.6 }}>
          Ces infos apparaîtront sur votre site pour que vos clients vous trouvent.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Votre ville *</label>
          <input
            value={data.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Paris, Lyon, Toulouse…"
            data-testid="ob-city"
            autoFocus
            style={{ ...inputStyle, borderColor: errors.city ? C.error : C.border }}
            onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
            onBlur={(e) => { e.target.style.borderColor = errors.city ? C.error : C.border; e.target.style.boxShadow = "none"; }}
          />
          {errors.city && <span style={{ fontSize: 12, color: C.error }}>{errors.city}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Téléphone *</label>
          <input
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="06 12 34 56 78"
            type="tel"
            data-testid="ob-phone"
            style={{ ...inputStyle, borderColor: errors.phone ? C.error : C.border }}
            onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
            onBlur={(e) => { e.target.style.borderColor = errors.phone ? C.error : C.border; e.target.style.boxShadow = "none"; }}
          />
          {errors.phone && <span style={{ fontSize: 12, color: C.error }}>{errors.phone}</span>}
          {!errors.phone && <span style={{ fontSize: 12, color: C.ink3 }}>Affiché sur votre site.</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>Email professionnel</label>
        <input
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="contact@votre-entreprise.fr"
          type="email"
          data-testid="ob-email"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = C.amber; e.target.style.boxShadow = `0 0 0 3px ${C.amberBg}`; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
        <span style={{ fontSize: 12, color: C.ink3 }}>Optionnel — pour recevoir les demandes de devis.</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "12px 14px", borderRadius: 16, background: C.greenBg, border: "1px solid #A8D5BC" }}>
        {["🔒 Données sécurisées", "✓ Site publié en 3 min", "✓ Modifiable à tout moment"].map((t) => (
          <span key={t} style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STYLE PARTAGÉ
══════════════════════════════════════════════════════════ */

const inputStyle = {
  height: 52, padding: "0 16px", borderRadius: 16,
  border: `1.5px solid #E2DDD6`, background: "#FFFFFF",
  fontSize: 15, color: "#1A1714", outline: "none", width: "100%",
  transition: "border-color 150ms, box-shadow 150ms",
  fontFamily: "inherit",
};

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({
    business_name:  "",
    business_types: [],
    services:       [],
    city:           "",
    phone:          "",
    email:          "",
    style:          "chaleureux",
    generate_image: true,
  });

  const TOTAL = 3;
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!data.business_name.trim()) e.business_name = "Entrez le nom de votre entreprise";
      if (data.business_types.length === 0) e.business_type = "Choisissez au moins un métier";
    }
    if (step === 2 && data.services.length === 0) e.services = "Ajoutez au moins 1 service";
    if (step === 3) {
      if (!data.city.trim()) e.city = "Entrez votre ville";
      if (!data.phone.trim()) e.phone = "Entrez votre téléphone";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isNextDisabled = () => {
    if (step === 1) return !data.business_name || data.business_types.length === 0;
    if (step === 2) return data.services.length === 0;
    if (step === 3) return !data.city || !data.phone;
    return false;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const back = () => {
    if (step === 1) { nav("/dashboard"); return; }
    setStep((s) => s - 1);
    setErrors({});
    window.scrollTo(0, 0);
  };

  const submit = () => {
    if (!validate()) return;
    // Compat backend : business_type = premier métier (string)
    const payload = {
      ...data,
      business_type: data.business_types.join(" / "),
      description: "",
    };
    sessionStorage.setItem("aw_pending", JSON.stringify(payload));
    nav("/generating");
  };

  return (
    <div
      style={{ minHeight: "100vh", background: C.canvas }}
      data-testid="onboarding-page"
    >
      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(244,246,251,0.92)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 20px 10px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, background: GRADIENT, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>H</span>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', Georgia, serif", fontWeight: 700, fontSize: 17, color: C.ink }}>Hustart</span>
            </div>
            <StepLabel step={step} total={TOTAL} />
          </div>
          <ProgressBar step={step} total={TOTAL} />
        </div>
      </header>

      {/* ── Contenu ── */}
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px 20px 120px" }}>
        {step === 1 && <Step1 data={data} set={set} />}
        {step === 2 && <Step2 data={data} set={set} />}
        {step === 3 && <Step3 data={data} set={set} errors={errors} />}

        {/* Erreurs globales */}
        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 16, background: "#FAE0DD", border: "1px solid #F5C5C0" }}>
            <p style={{ fontSize: 13, color: C.error, fontWeight: 600, margin: 0 }}>
              ⚠ Complétez les champs manquants pour continuer.
            </p>
          </div>
        )}
      </main>

      {/* ── Footer sticky ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(244,246,251,0.95)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.border}`, padding: "16px 24px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={back}
            data-testid="ob-back"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              gap: 8, height: 52, padding: "0 24px", borderRadius: 9999,
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              background: "transparent", color: C.ink2, border: `1.5px solid ${C.border}`,
              transition: "all 150ms ease",
            }}
          >
            ← {step === 1 ? "Annuler" : "Retour"}
          </button>

          {step < TOTAL ? (
            <button
              type="button"
              onClick={next}
              disabled={isNextDisabled()}
              data-testid="ob-next"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: 8, height: 52, padding: "0 24px", borderRadius: 9999, flex: 1,
                fontSize: 16, fontWeight: 700, cursor: isNextDisabled() ? "not-allowed" : "pointer",
                background: GRADIENT, color: "#fff", border: "none",
                opacity: isNextDisabled() ? 0.4 : 1,
                transition: "all 150ms ease",
              }}
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isNextDisabled()}
              data-testid="ob-submit"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: 8, height: 52, padding: "0 24px", borderRadius: 9999, flex: 1,
                fontSize: 16, fontWeight: 700, cursor: isNextDisabled() ? "not-allowed" : "pointer",
                background: GRADIENT, color: "#fff", border: "none",
                opacity: isNextDisabled() ? 0.4 : 1,
                transition: "all 150ms ease",
              }}
            >
              ✨ Générer mon site
            </button>
          )}
        </div>
      </div>
    </div>
  );
}