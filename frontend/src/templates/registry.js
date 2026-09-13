import { DEFAULT_THEME } from "@/components/ThemePicker";
import { DEFAULT_SECTION_ORDER } from "@/components/SectionsReorder";
import EssentialTemplate from "@/templates/essential/EssentialTemplate";
import AtelierTemplate from "@/templates/atelier/AtelierTemplate";
import BatisseurTemplate from "@/templates/batisseur/BatisseurTemplate";

/**
 * Template catalog.
 *
 * Phase A ships 3 pilots. `KNOWN_TEMPLATE_IDS` on the backend already accepts
 * the full set of 10 ids, so the remaining 7 (premium, creatif, minimal,
 * projet, confiance, impact, signature) can be appended here in Phase B —
 * each simply adds an entry plus a component, no architectural change.
 *
 * Each entry carries:
 *  - defaultTheme         : the template's signature tokens, used only when the
 *                           artisan has NOT customised the theme (site.theme wins).
 *  - defaultSectionOrder  : the template's preferred section order, overridable
 *                           by the artisan through SectionsReorder.
 *  - preview              : static tokens used to draw the selection mockup
 *                           (no live/real data is rendered in the grid).
 */
export const TEMPLATES = [
  {
    id: "essential",
    number: "01",
    name: "Essentiel",
    style: "Moderne, épuré",
    idealFor: "Tous métiers",
    badge: "Par défaut",
    description:
      "Le modèle historique : clair, moderne et polyvalent. Fonctionne pour tous les métiers, sans exception.",
    strengths: ["Polyvalent", "Équilibré", "Rapide à lire"],
    defaultTheme: DEFAULT_THEME,
    defaultSectionOrder: DEFAULT_SECTION_ORDER,
    Component: EssentialTemplate,
    preview: {
      bg: "#F4F6FB",
      surface: "#FFFFFF",
      text: "#0F1222",
      muted: "#9AA1B4",
      accent: DEFAULT_THEME.primary_color,
      accent2: DEFAULT_THEME.accent_color,
      radius: "20px",
      fullBleedHero: false,
      darkHero: false,
      gallery: 4,
    },
  },
  {
    id: "atelier",
    number: "02",
    name: "Atelier",
    style: "Chaleureux, artisanal",
    idealFor: "Menuisier, peintre, maçon, plombier",
    description:
      "Une identité chaleureuse et artisanale : grande photo pleine largeur, fond ivoire et titres serif.",
    strengths: ["Photo pleine largeur", "Fond ivoire", "Titres serif"],
    defaultTheme: {
      primary_color: "#5A3E2B",
      accent_color: "#C1683A",
      font_heading: "Fraunces",
      font_body: "Work Sans",
    },
    defaultSectionOrder: [
      "hero",
      "value_props",
      "services",
      "realisations",
      "transformation",
      "about",
      "process",
      "contact",
    ],
    Component: AtelierTemplate,
    preview: {
      bg: "#F7F1E7",
      surface: "#FFFDF8",
      text: "#3E3227",
      muted: "#B6A48D",
      accent: "#5A3E2B",
      accent2: "#C1683A",
      radius: "6px",
      fullBleedHero: true,
      darkHero: false,
      gallery: 4,
    },
  },
  {
    id: "batisseur",
    number: "04",
    name: "Bâtisseur",
    style: "Robuste, BTP",
    idealFor: "Maçon, gros œuvre, entreprise générale",
    description:
      "Une identité robuste type BTP : hero sombre à fort contraste, chiffres clés en grand et sections pleine largeur sans arrondis.",
    strengths: ["Hero sombre", "Chiffres clés", "Sections carrées"],
    defaultTheme: {
      primary_color: "#0F141B",
      accent_color: "#F59E0B",
      font_heading: "Space Grotesk",
      font_body: "Inter",
    },
    defaultSectionOrder: [
      "hero",
      "services",
      "realisations",
      "value_props",
      "transformation",
      "about",
      "process",
      "contact",
    ],
    Component: BatisseurTemplate,
    preview: {
      bg: "#F1F3F5",
      surface: "#FFFFFF",
      text: "#0F141B",
      muted: "#B9C0C9",
      accent: "#0F141B",
      accent2: "#F59E0B",
      radius: "0px",
      fullBleedHero: true,
      darkHero: true,
      gallery: 4,
    },
  },
];

/** Templates that are selectable today (Phase A pilots). */
export const PHASE_A_TEMPLATE_IDS = ["essential", "atelier", "batisseur"];

/** Announced for Phase B — shown as "à venir" until implemented. */
export const PHASE_B_TEMPLATES = [
  { id: "premium", name: "Premium", idealFor: "Rénovation, architecte, cuisine" },
  { id: "creatif", name: "Créatif", idealFor: "Peintre, décorateur, paysagiste" },
  { id: "minimal", name: "Minimal", idealFor: "Indépendants, tous métiers" },
  { id: "projet", name: "Projet", idealFor: "Métiers où la preuve visuelle compte" },
  { id: "confiance", name: "Confiance", idealFor: "BTP, rénovation" },
  { id: "impact", name: "Impact", idealFor: "Artisans voulant se démarquer" },
  { id: "signature", name: "Signature", idealFor: "Artisans haut de gamme" },
];

export const DEFAULT_TEMPLATE_ID = "essential";

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

/** Templates selectable in Phase A, in display order. */
export const SELECTABLE_TEMPLATES = PHASE_A_TEMPLATE_IDS.map((id) => BY_ID.get(id)).filter(Boolean);

export function getTemplate(id) {
  return BY_ID.get(id) || BY_ID.get(DEFAULT_TEMPLATE_ID);
}

export function getTemplateComponent(id) {
  return getTemplate(id).Component;
}

const normalize = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const ATELIER_KEYWORDS = [
  "menuis", "peintr", "plomb", "macon", "carrel", "couvre", "chauffag",
  "plaq", "platr", "serrur", "vitri", "solier", "facad", "etanch", "isolat",
  "cuisin", "salle de bain", "ebenist", "renovat", "charpent", "piscin",
  "paysag", "jardin", "nettoy", "ramon", "storist", "depann",
];

const BATISSEUR_KEYWORDS = [
  "macon", "gros oeuvre", "coffreur", "ferrail", "terrass", "canalisa",
  "charpente", "beton", "demolition", "entreprise generale", "batiment",
  "echafaud", "desamiant", "vrd", "assainiss", "travaux publics", "gros-oeuvre",
];

/**
 * Suggestive filter only — every template stays selectable.
 * Returns a de-duplicated list of template ids, most relevant first.
 */
export function recommendTemplates(businessType = "") {
  const haystack = normalize(businessType);
  const recommended = [];
  if (ATELIER_KEYWORDS.some((k) => haystack.includes(k))) recommended.push("atelier");
  if (BATISSEUR_KEYWORDS.some((k) => haystack.includes(k))) recommended.push("batisseur");
  // "essential" is always a safe choice and always last.
  recommended.push("essential");
  return [...new Set(recommended)];
}
