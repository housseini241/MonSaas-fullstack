import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function PreviewSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const nav = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | paid | timeout
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus("timeout"); return; }
    let attempts = 0;
    const max = 10;
    const tick = async () => {
      attempts++;
      try {
        const r = await api.get(`/sites/preview/status/${sessionId}`);
        setData(r.data);
        if (r.data.site_id) {
          setStatus("paid");
          return;
        }
        if (attempts >= max) { setStatus("timeout"); return; }
        setTimeout(tick, 2000);
      } catch (e) {
        if (attempts >= max) { setStatus("timeout"); return; }
        setTimeout(tick, 2000);
      }
    };
    tick();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="preview-success-page">
      <div className="max-w-lg w-full bg-white border border-border p-10 text-center">
        {status === "checking" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-6" />
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Confirmation du paiement…</h1>
            <p className="text-muted-foreground">Votre site est en cours de mise en ligne. Quelques secondes.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="w-16 h-16 bg-primary mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Votre site est en ligne 🎉</h1>
            <p className="text-muted-foreground mb-8">
              Votre accès Pro est activé. Vous pouvez maintenant personnaliser, connecter votre domaine et gérer vos demandes clients.
            </p>
            <Button
              onClick={() => nav(data?.site_id ? `/builder/${data.site_id}` : "/sites")}
              data-testid="preview-success-to-builder"
              className="rounded-sm h-12 px-6 bg-foreground hover:bg-primary text-white"
            >
              {data?.site_id ? "Personnaliser mon site" : "Voir mes sites"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
        {status === "timeout" && (
          <>
            <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Paiement en cours de confirmation</h1>
            <p className="text-muted-foreground mb-8">
              Le statut tarde à arriver. Vous recevrez un email dès que votre site sera en ligne. Si nécessaire, vérifiez votre paiement Stripe.
            </p>
            <Button onClick={() => nav("/sites")} className="rounded-sm h-12 px-6 bg-foreground hover:bg-primary text-white" data-testid="preview-success-to-sites">
              Aller à mes sites
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
