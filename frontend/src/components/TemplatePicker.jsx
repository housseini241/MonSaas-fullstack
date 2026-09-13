import { Check } from "lucide-react";
import TemplateMock from "@/components/TemplateMock";
import { SELECTABLE_TEMPLATES, PHASE_B_TEMPLATES, recommendTemplates } from "@/templates/registry";

/**
 * Template selector.
 *
 * Renders one static mockup per template (no live artisan data — see
 * TemplateMock) and always keeps every template selectable: the métier-based
 * recommendation is only a highlighted suggestion, never a restriction.
 *
 * Used both during onboarding (choice of the site's model) and in the site
 * settings (change the model afterwards without losing any data).
 */
export default function TemplatePicker({
  value,
  onChange,
  businessType = "",
  showComingSoon = true,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
}) {
  const haystack = Array.isArray(businessType) ? businessType.join(" / ") : businessType;
  const recommended = new Set(recommendTemplates(haystack));

  return (
    <div data-testid="template-picker">
      <div className={gridClassName}>
        {SELECTABLE_TEMPLATES.map((template) => {
          const selected = value === template.id;
          const isRecommended = recommended.has(template.id);
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              aria-pressed={selected}
              data-testid={`template-card-${template.id}`}
              className={[
                "group relative text-left border transition-all overflow-hidden bg-white",
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-ink-3 hover:-translate-y-0.5",
              ].join(" ")}
            >
              <div className="relative p-3 pb-0">
                <TemplateMock template={template} />

                {isRecommended && (
                  <span
                    className="absolute top-5 left-5 bg-primary text-white text-[10px] font-mono uppercase tracking-[0.14em] px-2 py-1 rounded-sm shadow-sm"
                    data-testid={`template-recommended-${template.id}`}
                  >
                    Recommandé
                  </span>
                )}

                {selected && (
                  <span className="absolute top-5 right-5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}

                <span className="absolute bottom-3 right-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90 mix-blend-difference">
                  {template.number}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-display font-semibold text-lg tracking-tight text-ink-1">
                    {template.name}
                  </div>
                  <div className="t-label">{template.style}</div>
                </div>
                <p className="text-xs text-ink-3 mt-1">Idéal pour : {template.idealFor}</p>
                <p className="text-sm text-ink-2 mt-2 leading-relaxed">{template.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.strengths.map((s) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-1 rounded-sm bg-surface-2 text-ink-2">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showComingSoon && (
        <div className="mt-6" data-testid="templates-coming-soon">
          <div className="t-label mb-2">Bientôt disponibles · {PHASE_B_TEMPLATES.length} modèles</div>
          <div className="flex flex-wrap gap-2">
            {PHASE_B_TEMPLATES.map((t) => (
              <span
                key={t.id}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-dashed border-border text-ink-3"
                title={`Idéal pour : ${t.idealFor}`}
              >
                {t.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-3 mt-2">
            Ces modèles seront ajoutés une fois les 3 premiers validés en production.
          </p>
        </div>
      )}
    </div>
  );
}
