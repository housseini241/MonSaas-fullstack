import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { CheckCircle2, Loader2, Globe, ShieldCheck, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DomainSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("polling"); // polling | active | pending | error
  const [domain, setDomain] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!sessionId) { setState("error"); return; }
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      try {
        const r = await api.get(`/domains/status/${sessionId}`);
        if (cancelled) return;
        setDomain(r.data);
        if (r.data.status === "active") { setState("active"); return; }
        if (r.data.status === "error") { setState("error"); return; }
        tries += 1;
        if (tries > 15) { setState("pending"); return; }
        setTimeout(poll, 2000);
      } catch (e) {
        if (!cancelled) setState("error");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  const fmt = (cents) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12" data-testid="domain-success">
      <div className="bg-white border border-border p-8 md:p-12 max-w-2xl w-full">
        {state === "polling" && (
          <div className="text-center">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <h1 className="font-display font-semibold text-3xl tracking-tight mt-5">Configuration en cours...</h1>
            <p className="text-muted-foreground mt-2 font-manrope">Achat du domaine, configuration DNS et SSL — moins d'une minute.</p>
          </div>
        )}

        {state === "active" && domain && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#1F3D2D]" />
              <div>
                <h1 className="font-display font-semibold text-3xl tracking-tight">Votre domaine est en ligne.</h1>
                <p className="text-muted-foreground font-manrope text-sm">Aucune configuration requise — tout est prêt.</p>
              </div>
            </div>

            <div className="bg-foreground text-white p-6 mb-5" data-testid="domain-success-card">
              <div className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-4 break-all">{domain.domain_name}</div>
              <div className="grid grid-cols-2 gap-3 text-sm font-manrope">
                <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> <span>DNS configuré</span></div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> <span>SSL {domain.ssl_issuer || "Let's Encrypt"}</span></div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> <span>Site servi automatiquement</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><span>Expire</span> <span className="font-mono text-xs">{new Date(domain.expiry_date).toLocaleDateString("fr-FR")}</span></div>
              </div>
            </div>

            {domain.dns_config?.records && (
              <details className="bg-background border border-border p-4 mb-5" data-testid="dns-records">
                <summary className="cursor-pointer text-sm font-display font-semibold">Configuration DNS appliquée (info)</summary>
                <table className="w-full mt-3 text-xs font-mono">
                  <thead>
                    <tr className="text-muted-foreground text-left"><th className="py-1">Type</th><th className="py-1">Nom</th><th className="py-1">Valeur</th><th className="py-1">TTL</th></tr>
                  </thead>
                  <tbody>
                    {domain.dns_config.records.map((r, i) => (
                      <tr key={i} className="border-t border-border/60"><td className="py-1.5">{r.type}</td><td className="py-1.5">{r.host}</td><td className="py-1.5 break-all">{r.value}</td><td className="py-1.5">{r.ttl}</td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            <div className="flex flex-wrap gap-3">
              <a href={`https://${domain.domain_name}`} target="_blank" rel="noreferrer">
                <Button className="rounded-sm bg-primary hover:bg-foreground text-white h-12 px-6" data-testid="visit-domain-btn">
                  Voir mon site <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Button variant="outline" onClick={() => nav("/dashboard")} className="rounded-sm border-border h-12 px-6" data-testid="back-to-dashboard">
                Retour au dashboard
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-manrope">Payé : <b>{fmt(domain.amount_cents)}</b> · renouvellement annuel · résiliable à tout moment.</p>
          </div>
        )}

        {state === "pending" && domain && (
          <div className="text-center">
            <Clock className="w-10 h-10 mx-auto text-primary" />
            <h1 className="font-display font-semibold text-3xl tracking-tight mt-5">Paiement en cours de confirmation</h1>
            <p className="text-muted-foreground mt-2 font-manrope">Vous recevrez un email dès que votre domaine <b>{domain.domain_name}</b> sera actif.</p>
            <Link to="/dashboard" className="inline-block mt-6 text-primary underline underline-offset-4">Retour au dashboard</Link>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <h1 className="font-display font-semibold text-3xl tracking-tight mt-5">Une erreur est survenue</h1>
            <p className="text-muted-foreground mt-2 font-manrope">Votre paiement a peut-être été annulé. Si vous avez été débité, contactez-nous — aucune configuration n'est appliquée sans paiement confirmé.</p>
            <Link to="/dashboard" className="inline-block mt-6 text-primary underline underline-offset-4">Retour au dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
}
