import { useState } from "react";

/**
 * Contact / devis form state machine shared by all site templates.
 *
 * Extracted verbatim from ArtisanTemplate.jsx so the `essential` template
 * keeps the exact same behaviour: the parent supplies `onSubmitLead`
 * (POST /public/sites/{slug}/leads in production, a no-op/toast in preview),
 * and the hook handles the fields, the sending flag and the success state.
 */
export default function useLeadForm(onSubmitLead) {
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

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

  return { lead, setLead, sent, sending, handleSubmit };
}
