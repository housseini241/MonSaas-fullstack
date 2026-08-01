import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function DomainCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="domain-cancel">
      <div className="bg-white border border-border p-10 max-w-md w-full text-center">
        <XCircle className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="font-display font-semibold text-2xl tracking-tight mt-4">Achat annulé</h1>
        <p className="text-muted-foreground mt-2 font-manrope text-sm">Aucun débit n'a été effectué. Vous pouvez reprendre votre recherche quand vous voulez.</p>
        <Link to="/domains" className="inline-block mt-6">
          <Button className="rounded-sm bg-foreground hover:bg-primary text-white" data-testid="domain-cancel-retry">Retour à la recherche</Button>
        </Link>
      </div>
    </div>
  );
}
