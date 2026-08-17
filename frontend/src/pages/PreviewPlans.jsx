import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  "Votre site pro en ligne, généré à partir de vos infos, modifiable à tout moment (textes, photos, services) — sans aucune compétence technique",
  "Votre propre nom de domaine (monentreprise.fr) au lieu d'une adresse générique",
  "Fiche sur l'annuaire Hustart — visibilité supplémentaire auprès de clients qui cherchent un artisan",
  "Référencement Google (SEO local) — votre site optimisé pour apparaître quand un client cherche votre métier dans votre ville",
  "Demandes de devis reçues par email ET WhatsApp — aucune demande ratée",
  "Devis et factures illimités, envoyés par email, avec signature électronique du client directement en ligne",
  "Facturation électronique conforme à la réforme obligatoire de 2026 (Factur-X)",
  "Agenda et rendez-vous clients centralisés",
  "Suivi client (CRM) — historique des échanges, coordonnées, devis passés",
];

export default function PreviewPlans() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const draftId = params.get("draft_id");
  const [loadingPlan, setLoadingPlan] = useState(null);

  if (!draftId) {
    nav("/preview");
    return null;
  }

  const handleChoose = async (packageId) => {
    setLoadingPlan(packageId);
    try {
      const r = await api.post("/sites/preview/checkout", {
        draft_id: draftId,
        package_id: packageId,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Impossible de lancer le paiement, réessayez.");
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: "pro_monthly",
      badge: "-60%",
      name: "Mensuel",
      strikethrough: "47€",
      price: "19€",
      period: "/mois",
      equivalent: "19€/mois",
      savings: "28€ économisés/mois",
      cta: "Choisir le mensuel",
      highlighted: false,
    },
    {
      id: "pro_yearly",
      badge: "-67%",
      recommended: "Recommandé",
      name: "Annuel",
      strikethrough: "564€",
      price: "185€",
      period: "/an",
      equivalent: "soit 15,42€/mois",
      savings: "379€ économisés/an (~2 mois offerts)",
      cta: "Choisir l'annuel",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1222]" data-testid="preview-plans-page">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-14 md:py-20">
        {/* Header */}
        <button
          type="button"
          onClick={() => nav(`/preview?draft_id=${draftId}`)}
          data-testid="plans-back-preview"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-[#666B85] hover:text-[#0F1222] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'aperçu
        </button>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wide text-[#4F46E5] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" />
            Mise en ligne
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Votre site est prêt.{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">
              Choisissez votre formule.
            </span>
          </h1>
          <p className="mt-4 text-[15px] text-[#666B85] leading-relaxed">
            Paiement sécurisé via Stripe · Sans engagement 
          </p>
        </div>

        {/* Cartes */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.id}
              data-testid={`plan-${p.id}`}
              data-testid-recommended={p.recommended ? "true" : undefined}
              className={`relative rounded-[26px] p-8 transition-transform hover:-translate-y-1 ${
                p.highlighted
                  ? "bg-[#0B0F1E] text-white shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
                  : "bg-white border-[1.5px] border-[#E4E8F1] shadow-[0_8px_24px_rgba(20,25,60,0.07)]"
              }`}
            >
              {p.recommended && (
                <span
                  className="absolute -top-3 right-7 inline-flex items-center gap-1 text-white text-[11px] font-bold px-3.5 py-1 rounded-full"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  <Sparkles className="w-3 h-3" /> {p.recommended}
                </span>
              )}
              <span
                className={`absolute -top-3 left-7 inline-flex items-center gap-1 text-[11px] font-bold px-3.5 py-1 rounded-full ${
                  p.highlighted ? "bg-white/15 text-white" : "bg-[#EEF0FE] text-[#4F46E5]"
                }`}
              >
                <Tag className="w-3 h-3" /> {p.badge}
              </span>

              <div className={`text-xs font-bold uppercase tracking-wide mb-3.5 ${p.highlighted ? "text-[#A9AFC7]" : "text-[#666B85]"}`}>
                Pro · {p.name}
              </div>

              <div className="font-display text-[42px] font-bold mb-1">
                <span className={p.highlighted ? "text-[#A9AFC7] line-through text-[24px] align-middle mr-3" : "text-[#A9AFC7] line-through text-[24px] align-middle mr-3"}>
                  {p.strikethrough}
                </span>
                {p.price}
                <span className={`text-sm font-medium ${p.highlighted ? "text-[#A9AFC7]" : "text-[#666B85]"}`}> {p.period}</span>
              </div>

              <p className={`text-[13.5px] mb-6 ${p.highlighted ? "text-[#A9AFC7]" : "text-[#666B85]"}`}>
                <span className="font-semibold">{p.equivalent}</span> · <span className="font-semibold">{p.savings}</span>
              </p>

              <Button
                onClick={() => handleChoose(p.id)}
                disabled={!!loadingPlan}
                data-testid={`plan-${p.id}-cta`}
                data-umami-event="preview-plan-choose-click"
                data-umami-event-plan={p.id}
                className={`w-full h-12 rounded-full ${
                  p.highlighted
                    ? "text-white font-semibold text-[15px] transition-transform hover:-translate-y-0.5"
                    : "bg-[#0B0F1E] hover:bg-[#0F1222] text-white font-semibold text-[15px] transition-transform hover:-translate-y-0.5"
                }`}
                style={p.highlighted ? { background: "linear-gradient(120deg, #4F46E5, #22D3EE)" } : undefined}
              >
                {loadingPlan === p.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirection…</>
                ) : (
                  p.cta
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Avantages communs */}
        <div className="max-w-4xl mx-auto mt-14">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              Tout est inclus dans votre formule
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3.5 bg-white border-[1.5px] border-[#E4E8F1] rounded-[26px] p-8 shadow-[0_8px_24px_rgba(20,25,60,0.07)]">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed" data-testid={`benefit-${i}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#22D3EE]" />
                <span>{b}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-[11.5px] font-mono uppercase tracking-[0.14em] text-[#666B85]">
            paiement sécurisé via stripe 
          </p>
        </div>
      </div>
    </div>
  );
}
