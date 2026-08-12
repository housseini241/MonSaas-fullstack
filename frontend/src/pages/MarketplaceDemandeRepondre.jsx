import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import DevisFormModal from "@/components/DevisFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check, ArrowRight, MapPin, Hammer, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const URGENCE_LABELS = {
  normal: "Normal",
  urgent: "Urgent",
  tres_urgent: "Très urgent",
};

export default function MarketplaceDemandeRepondre() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demande, setDemande] = useState(null); // { client_id, besoin, urgence, type_travaux, city }
  const [modalOpen, setModalOpen] = useState(false);
  const [createdDevis, setCreatedDevis] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // 1. Préparer le client CRM + ouvrir le modal
  useEffect(() => {
    api
      .post(`/artisan/marketplace/demandes/${id}/repondre`)
      .then((res) => {
        setDemande(res.data);
        setModalOpen(true);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || "Cette demande n'est plus disponible");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Devis créé → écran "envoyer par email"
  const handleDevisCreated = (devis) => {
    setModalOpen(false);
    setCreatedDevis(devis);
  };

  // 3. Envoi du devis par email + confirmation côté marketplace
  const handleSendEmail = async () => {
    if (!createdDevis?.id) return;
    setSending(true);
    try {
      await api.post(`/artisan/devis/${createdDevis.id}/send-email`);
      await api.post(`/artisan/marketplace/demandes/${id}/confirm-sent`, {
        devis_id: createdDevis.id,
      });
      setSent(true);
      toast.success("Devis envoyé au client !");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi de l'email");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell
      title={<>Répondre à l'appel d'offres</>}
      eyebrow={demande ? `${demande.city} · ${demande.type_travaux || "métier non précisé"}` : undefined}
    >
      <div data-testid="demande-repondre-page" className="max-w-3xl mx-auto">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <section className="bg-surface border border-border rounded-xl shadow-sm p-10 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-display-m text-ink-1 mb-2">Demande indisponible</h2>
            <p className="text-sm text-ink-3 mb-8">{error}</p>
            <Link to="/dashboard">
              <Button className="rounded-xl">Retour au tableau de bord</Button>
            </Link>
          </section>
        ) : sent && createdDevis ? (
          /* ===== Écran final : confirmation ===== */
          <section
            className="bg-surface border border-border rounded-xl shadow-sm p-10 md:p-14 text-center"
            data-testid="repondre-confirmation"
          >
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8" />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 mb-2">
              // devis envoyé
            </div>
            <h2 className="font-display text-display-l text-ink-1 mb-3">
              Devis envoyé au client !
            </h2>
            <p className="text-ink-3 text-sm max-w-md mx-auto mb-8">
              Votre devis <strong className="text-ink-1">{createdDevis.numero || ""}</strong> a été
              envoyé par email au prospect, et le client a été ajouté à votre CRM.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/dashboard">
                <Button
                  className="bg-primary text-primary-foreground rounded-xl shadow-primary px-6 h-11"
                  data-testid="repondre-go-dashboard"
                >
                  Découvrir mon tableau de bord <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="outline" className="border-border rounded-xl px-6 h-11">
                  Créer mon site en 5 minutes
                </Button>
              </Link>
            </div>
          </section>
        ) : createdDevis && demande ? (
          /* ===== Écran intermédiaire : devis créé, à envoyer ===== */
          <section className="bg-surface border border-border rounded-xl shadow-sm p-10 md:p-14 text-center">
            <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8" />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 mb-2">
              // devis créé
            </div>
            <h2 className="font-display text-display-l text-ink-1 mb-3">Devis créé avec succès !</h2>
            <p className="text-ink-3 text-sm max-w-md mx-auto mb-8">
              Envoyez-le maintenant au prospect pour finaliser votre réponse à l'appel d'offres.
            </p>
            <Button
              onClick={handleSendEmail}
              disabled={sending}
              className="bg-primary text-primary-foreground rounded-xl shadow-primary px-8 h-12"
              data-testid="repondre-send-email"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" /> Envoyer par email →</>
              )}
            </Button>
          </section>
        ) : (
          /* ===== Résumé de la demande + modal de création de devis ===== */
          <>
            {demande && (
              <section className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-display-m text-ink-1 mt-1">Appel d'offres</h2>
                  {demande.urgence === "tres_urgent" ? (
                    <Badge variant="destructive">Très urgent</Badge>
                  ) : demande.urgence === "urgent" ? (
                    <Badge variant="warning">Urgent</Badge>
                  ) : (
                    <Badge variant="secondary">Normal</Badge>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="t-label mb-0.5">Ville</div>
                      <div className="text-sm font-medium text-ink-1">{demande.city}</div>
                    </div>
                  </div>
                  {demande.type_travaux && (
                    <div className="flex items-start gap-3">
                      <Hammer className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="t-label mb-0.5">Métier</div>
                        <div className="text-sm font-medium text-ink-1">{demande.type_travaux}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="t-label mb-0.5">Urgence</div>
                      <div className="text-sm font-medium text-ink-1">
                        {URGENCE_LABELS[demande.urgence] || "Normal"}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-2/50 border border-border rounded-md">
                    <div className="t-label mb-2">Le besoin</div>
                    <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">
                      {demande.besoin}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {modalOpen && demande && (
              <DevisFormModal
                presetClientId={demande.client_id}
                onClose={() => setModalOpen(false)}
                onSuccess={handleDevisCreated}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
