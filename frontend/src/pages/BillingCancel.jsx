import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="billing-cancel-page">
      <div className="max-w-lg w-full bg-white border border-border p-10 text-center">
        <div className="w-14 h-14 bg-background border border-border mx-auto mb-6 flex items-center justify-center">
          <X className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="font-display font-semibold text-3xl tracking-tight mb-2">Paiement annulé</h1>
        <p className="text-muted-foreground mb-8">Aucun montant n'a été débité. Vous pouvez réessayer quand vous voulez.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/billing"><Button variant="outline" className="rounded-sm h-12 px-6 border-border" data-testid="cancel-retry">Retour aux offres</Button></Link>
          <Link to="/dashboard"><Button className="rounded-sm h-12 px-6 bg-foreground hover:bg-primary text-white" data-testid="cancel-to-dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
