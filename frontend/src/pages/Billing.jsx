import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Sparkles, Crown } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function Billing() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    api.get("/billing/me")
      .then((r) => setInfo(r.data))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const checkout = async (packageId) => {
    setPaying(packageId);
    try {
      const r = await api.post("/billing/checkout", {
        package_id: packageId,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Impossible de lancer le paiement");
      setPaying(null);
    }
  };

  const cancelSubscription = async () => {
    if (!info?.stripe_subscription_id) return;
    setManaging(true);
    try {
      await api.post("/billing/cancel");
      toast.success("Abonnement annulé. Votre accès Pro reste actif jusqu'à la fin de la période en cours.");
      const r = await api.get("/billing/me");
      setInfo(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Impossible d'annuler l'abonnement");
    } finally {
      setManaging(false);
    }
  };

  const isPro = info?.plan === "pro";
  const hasSubscription = !!info?.stripe_subscription_id;
  const proUntil = info?.pro_until ? new Date(info.pro_until) : null;

  return (
    <AppShell
      eyebrow={isPro ? (hasSubscription ? "/ abonnement · prélèvement automatique actif" : `/ abonnement · pro actif jusqu'au ${proUntil?.toLocaleDateString("fr-FR")}`) : "/ abonnement · choisissez votre formule"}
      title={
        loading
          ? <span className="text-ink-3">Facturation</span>
          : isPro
          ? <>Vous êtes <span className="font-light italic text-primary">Pro</span>.</>
          : <>Passez à <span className="font-light italic text-primary">Pro</span>.</>
      }
    >
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6" data-testid="billing-page">
          {isPro && (
            <div className="bg-ink-1 text-surface rounded-xl p-6 flex items-center gap-4 shadow-md" data-testid="pro-active-banner">
              <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold text-lg">Plan Pro actif</div>
                <div className="text-sm text-surface/70">
                  {hasSubscription
                    ? "Renouvellement automatique — votre carte est débitée chaque période."
                    : `Expire le ${proUntil?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* FREE */}
            <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
              <div className="t-label mb-3">free</div>
              <div className="font-display font-semibold text-5xl tracking-tight mb-1 text-ink-1">
                0€<span className="text-base font-sans font-normal text-ink-3"> /mois</span>
              </div>
              <p className="text-sm text-ink-3 mb-8">Pour découvrir.</p>
              <ul className="space-y-3 mb-8 text-sm text-ink-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 1 site généré</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Sous-domaine HuStart.fr</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> SEO local</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Capture de leads</li>
              </ul>
              <Button variant="outline" disabled className="w-full h-12" data-testid="plan-free-current">
                {isPro ? "—" : "Plan actuel"}
              </Button>
            </div>

            {/* PRO MONTHLY */}
            <div className="bg-ink-1 text-surface rounded-xl p-8 relative shadow-md">
              <Badge variant="default" className="absolute -top-2.5 left-8">Recommandé</Badge>
              <div className="t-label !text-surface/50 mb-3">pro · mensuel</div>
              <div className="font-display font-semibold text-5xl tracking-tight mb-1 text-surface">
                19€<span className="text-base font-sans font-normal text-surface/60"> /mois</span>
              </div>
              <p className="text-sm text-surface/70 mb-8">+30 jours de Pro à chaque paiement.</p>
              <ul className="space-y-3 mb-8 text-sm text-surface/90">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Domaine personnalisé</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Boutique e-commerce</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Régénération images IA</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Notifications email leads</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Support prioritaire</li>
              </ul>
              {isPro && hasSubscription ? (
                <Button
                  onClick={cancelSubscription}
                  disabled={managing}
                  variant="outline"
                  className="w-full h-12"
                  data-testid="plan-pro-manage"
                >
                  {managing
                    ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Annulation…</>
                    : <>Gérer mon abonnement <ArrowRight className="w-4 h-4" /></>}
                </Button>
              ) : (
                <Button
                  onClick={() => checkout("pro_monthly")}
                  disabled={!!paying}
                  data-testid="plan-pro-monthly"
                  data-umami-event="billing-upgrade-click"
                  className="w-full h-12"
                >
                  {paying === "pro_monthly"
                    ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Redirection…</>
                    : <>{isPro ? "S'abonner" : "Passer à Pro"} <ArrowRight className="w-4 h-4" /></>}
                </Button>
              )}
            </div>
          </div>

          {/* YEARLY upsell */}
          <div className="bg-surface border border-border rounded-xl p-6 grid md:grid-cols-12 gap-6 items-center shadow-sm" data-testid="yearly-upsell">
            <div className="md:col-span-7">              <h3 className="font-display text-display-m mb-1 text-ink-1">Pro Annuel · 190€</h3>
              <p className="text-sm text-ink-3">12 mois de Pro pour le prix de 10. La meilleure offre.</p>
            </div>
            <div className="md:col-span-5 md:flex md:justify-end">
              {isPro && hasSubscription ? (
                <Button
                  onClick={cancelSubscription}
                  disabled={managing}
                  variant="accent"
                  size="lg"
                  className="w-full md:w-auto"
                  data-testid="plan-yearly-manage"
                >
                  {managing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Annulation…</>
                    : <><Sparkles className="w-4 h-4" /> Gérer mon abonnement</>}
                </Button>
              ) : (
                <Button
                  onClick={() => checkout("pro_yearly")}
                  disabled={!!paying}
                  data-testid="plan-pro-yearly"
                  data-umami-event="billing-upgrade-click"
                  variant="accent"
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {paying === "pro_yearly"
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</>
                    : <><Sparkles className="w-4 h-4" /> Prendre l'annuel</>}
                </Button>
              )}
            </div>
          </div>

          <p className="t-label text-center pt-4">
            paiement sécurisé via stripe · résiliation à tout moment
          </p>
        </div>
      )}
    </AppShell>
  );
}
