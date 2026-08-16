import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import ArtisanTemplate from "@/components/ArtisanTemplate";

function slugifyDraft(text = "") {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || "site"
  );
}

/**
 * Construit l'objet `site` attendu par ArtisanTemplate à partir du draft de preview.
 * Zéro divergence avec le shape du site_doc final créé au moment du paiement.
 */
function buildSiteFromDraft(draft) {
  const p = draft.payload || {};
  return {
    id: `draft-${draft.id}`,
    slug: slugifyDraft(`${p.business_name}-${p.city}`),
    business_name: p.business_name,
    business_type: p.business_type,
    services: p.services || [],
    city: p.city,
    phone: p.phone,
    email: p.email,
    style: p.style || "moderne",
    content: draft.content || {},
    hero_image_url: null,
    logo_url: null,
    service_image_urls: [],
    credentials: [],
    realisations: [],
    transformations: [],
    show_map: false,
    map_address: null,
    status: "draft",
  };
}

export default function Preview() {
  const nav = useNavigate();
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("aw_draft");
    if (!raw) {
      nav("/onboarding");
      return;
    }
    try {
      setDraft(JSON.parse(raw));
    } catch {
      nav("/onboarding");
    }
  }, [nav]);

  if (!draft) return null;

  const site = buildSiteFromDraft(draft);

  const handlePreviewLeadIntercept = () => {
    // Ne rien envoyer au backend : on redirige vers la barre de publication.
    toast.info("Publiez votre site pour recevoir les demandes clients", {
      description: "Choisissez une formule pour activer le formulaire de contact.",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="preview-mode min-h-screen bg-[#F4F6FB]" data-testid="preview-page">
      {/* Masque la barre mobile du template (Appeler / Devis) au profit de la barre de publication */}
      <style>{`.preview-mode .fixed.bottom-3\\.5.left-3\\.5.right-3\\.5{display:none!important;}`}</style>

      <ArtisanTemplate
        site={site}
        isPreview
        editable={false}
        onSubmitLead={handlePreviewLeadIntercept}
      />

      {/* Barre sticky : un seul bouton, sans prix */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-md border-t border-[#E4E8F1] px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#0F1222]">
              Aperçu de votre site
            </div>
            <div className="text-[12.5px] text-[#6B7280]">
              Texte, services, coordonnées — modifiables à tout moment après publication.
            </div>
          </div>
          <button
            type="button"
            data-testid="preview-publish-cta"
            data-umami-event="preview-publish-click"
            onClick={() => nav(`/preview/plans?draft_id=${draft.id}`)}
            className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-full font-semibold text-[15px] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
            style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
          >
            Publier mon site <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
