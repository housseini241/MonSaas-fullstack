import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bouton retour qui revient à la page précédente (history.back).
 * Peut être placé en haut de chaque page interne.
 */
export default function BackButton({ to, label = "Retour", className = "" }) {
  const nav = useNavigate();
  const handleClick = () => {
    if (to) {
      nav(to);
    } else {
      nav(-1);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`rounded-sm border-border hover:bg-foreground hover:text-white ${className}`}
      data-testid="back-button"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
