import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function BillingSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const nav = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | paid | failed | timeout
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus("failed"); return; }
    let attempts = 0;
    const max = 10;
    const tick = async () => {
      attempts++;
      try {
        const r = await api.get(`/billing/status/${sessionId}`);
        setData(r.data);
        if (r.data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        if (r.data.status === "expired" || r.data.status === "complete" && r.data.payment_status === "unpaid") {
          setStatus("failed");
          return;
        }
        if (attempts >= max) { setStatus("timeout"); return; }
        setTimeout(tick, 2000);
      } catch (e) {
        if (attempts >= max) { setStatus("failed"); return; }
        setTimeout(tick, 2000);
      }
    };
    tick();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="billing-success-page">
      <div className="max-w-lg w-full bg-white border border-border p-10 text-center">
        {status === "checking" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-6" />
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Vérification du paiement…</h1>
            <p className="text-muted-foreground">Quelques secondes le temps que Stripe confirme.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="w-16 h-16 bg-primary mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Bienvenue sur Pro 🎉</h1>
            <p className="text-muted-foreground mb-2">{data?.amount} {data?.currency?.toUpperCase()} · {data?.package_id}</p>
            <p className="text-muted-foreground mb-8">Votre accès Pro est activé. Domaine personnalisé et boutique e-commerce disponibles.</p>
            <Button onClick={() => nav("/dashboard")} data-testid="success-to-dashboard" className="rounded-sm h-12 px-6 bg-foreground hover:bg-primary text-white">
              Aller au dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
        {(status === "failed" || status === "timeout") && (
          <>
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Paiement non confirmé</h1>
            <p className="text-muted-foreground mb-8">{status === "timeout" ? "Le statut tarde à arriver. Vérifiez votre email Stripe ou réessayez." : "La transaction n'a pas abouti."}</p>
            <Link to="/billing">
              <Button className="rounded-sm h-12 px-6 bg-foreground hover:bg-primary text-white" data-testid="failed-back-billing">
                Retour à la facturation
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
