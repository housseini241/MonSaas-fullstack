import { Check, Send } from "lucide-react";

/**
 * Single implementation of the artisan contact / devis form.
 *
 * All templates share this component so the lead submission flow
 * (POST /public/sites/{slug}/leads via `onSubmitLead`) is never duplicated.
 * Only the *presentation* changes between templates, via the `variant` prop.
 *
 * The "essential" variant reproduces the historical markup and classes
 * exactly, so Template 01 keeps rendering unchanged. New templates only add
 * an entry to VARIANTS — no logic is duplicated.
 */
const GRADIENT = "linear-gradient(120deg, var(--site-grad-a), var(--site-grad-b))";

const VARIANTS = {
  essential: {
    card: "bg-white p-8 md:p-9 rounded-[28px] shadow-[0_10px_30px_rgba(20,25,60,0.08)] space-y-4",
    label: "text-xs font-semibold text-[#6B7280] block mb-1.5",
    input:
      "w-full bg-[#F4F6FB] border-[1.5px] border-[#E4E8F1] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]",
    successIcon:
      "w-14 h-14 text-white rounded-full mx-auto mb-4 flex items-center justify-center",
    successTitle: "font-display text-xl font-bold mb-2",
    successText: "text-[#6B7280]",
    rgpdLabel: "flex items-start gap-2.5 text-xs text-[#6B7280]",
    submit:
      "w-full text-white px-6 py-4 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-transform hover:-translate-y-0.5",
    submitStyle: { background: GRADIENT },
    successIconStyle: { background: GRADIENT },
    linkColor: "var(--site-grad-a)",
    hint: "text-center text-xs text-[#6B7280]",
    checkbox: undefined,
  },
  atelier: {
    card: "bg-[#FFFDF8] p-8 md:p-9 rounded-[6px] border border-[#E7DCCB] space-y-4",
    label: "text-xs font-semibold text-[#7A6A57] block mb-1.5",
    input:
      "w-full bg-[#FBF7F0] border-[1.5px] border-[#E7DCCB] rounded-[6px] px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]",
    successIcon:
      "w-14 h-14 text-white rounded-[6px] mx-auto mb-4 flex items-center justify-center",
    successTitle: "font-display text-2xl font-bold mb-2 text-[#3E3227]",
    successText: "text-[#7A6A57]",
    rgpdLabel: "flex items-start gap-2.5 text-xs text-[#7A6A57]",
    submit:
      "w-full text-white px-6 py-4 rounded-[6px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-transform hover:-translate-y-0.5",
    submitStyle: { background: GRADIENT },
    successIconStyle: { background: GRADIENT },
    linkColor: "var(--site-grad-a)",
    hint: "text-center text-xs text-[#7A6A57]",
    checkbox: undefined,
  },
  batisseur: {
    card: "bg-[#151A22] p-8 md:p-9 rounded-none border-2 border-[#2A313D] space-y-4",
    label:
      "text-[11px] font-bold uppercase tracking-wider text-[#9AA4B2] block mb-1.5",
    input:
      "w-full bg-[#0E1218] border-2 border-[#2A313D] text-white rounded-none px-4 py-3 focus:outline-none focus:border-[var(--site-grad-b)]",
    successIcon:
      "w-14 h-14 text-[#0B0F14] rounded-none mx-auto mb-4 flex items-center justify-center",
    successTitle: "font-display text-2xl font-bold mb-2 text-white uppercase",
    successText: "text-[#9AA4B2]",
    rgpdLabel: "flex items-start gap-2.5 text-xs text-[#9AA4B2]",
    submit:
      "w-full px-6 py-4 rounded-none font-bold uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 transition-transform hover:-translate-y-0.5",
    submitStyle: { background: "var(--site-grad-b)", color: "#0B0F14" },
    successIconStyle: { background: "var(--site-grad-b)" },
    linkColor: "var(--site-grad-b)",
    hint: "text-center text-xs text-[#9AA4B2]",
    checkbox: { accentColor: "var(--site-grad-b)" },
  },
  confiance: {
    card: "bg-white p-8 md:p-9 rounded-[4px] border border-[#D7DEE6] space-y-4",
    label: "text-xs font-semibold text-[#5A6675] block mb-1.5",
    input:
      "w-full bg-[#F7F9FB] border-[1.5px] border-[#D7DEE6] rounded-[4px] px-4 py-3 focus:outline-none focus:border-[var(--site-grad-a)]",
    successIcon:
      "w-14 h-14 text-white rounded-[4px] mx-auto mb-4 flex items-center justify-center",
    successTitle: "font-display text-xl font-bold mb-2 text-[#1E3A5F]",
    successText: "text-[#5A6675]",
    rgpdLabel: "flex items-start gap-2.5 text-xs text-[#5A6675]",
    submit:
      "w-full text-white px-6 py-4 rounded-[4px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors",
    submitStyle: { background: "var(--site-grad-a)" },
    successIconStyle: { background: "var(--site-grad-a)" },
    linkColor: "var(--site-grad-a)",
    hint: "text-center text-xs text-[#5A6675]",
    checkbox: undefined,
  },
};

export default function ContactForm({
  variant = "essential",
  lead,
  setLead,
  sent,
  sending,
  handleSubmit,
  onSubmitLead,
}) {
  const styles = VARIANTS[variant] || VARIANTS.essential;

  return (
    <form onSubmit={handleSubmit} className={styles.card} data-testid="contact-form">
      {sent ? (
        <div className="text-center py-8">
          <div className={styles.successIcon} style={styles.successIconStyle}>
            <Check className="w-6 h-6" />
          </div>
          <h3 className={styles.successTitle}>Message envoyé</h3>
          <p className={styles.successText}>Nous vous recontactons rapidement.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-3.5">
            <div>
              <label className={styles.label}>Nom complet *</label>
              <input
                required
                value={lead.name}
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
                data-testid="lead-name"
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Téléphone</label>
              <input
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                data-testid="lead-phone"
                className={styles.input}
              />
            </div>
          </div>
          <div>
            <label className={styles.label}>Email *</label>
            <input
              required
              type="email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
              data-testid="lead-email"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Votre projet *</label>
            <textarea
              required
              rows={4}
              value={lead.message}
              onChange={(e) => setLead({ ...lead, message: e.target.value })}
              data-testid="lead-message"
              placeholder="Décrivez votre besoin en quelques mots..."
              className={styles.input}
            />
          </div>
          <label className={styles.rgpdLabel}>
            <input
              type="checkbox"
              required
              className="mt-0.5"
              style={styles.checkbox}
              data-testid="lead-rgpd"
            />
            <span>
              J'accepte que mes informations soient utilisées pour être recontacté(e) au sujet de ma
              demande. Voir la{" "}
              <a href="#" className="underline" style={{ color: styles.linkColor }}>
                politique de confidentialité
              </a>
              .
            </span>
          </label>
          <button
            type="submit"
            disabled={sending || !onSubmitLead}
            data-testid="lead-submit"
            className={styles.submit}
            style={styles.submitStyle}
          >
            {sending ? "Envoi..." : <>Envoyer ma demande <Send className="w-4 h-4" /></>}
          </button>
          {!onSubmitLead && <p className={styles.hint}>Aperçu — formulaire désactivé</p>}
        </>
      )}
    </form>
  );
}
