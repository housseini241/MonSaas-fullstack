import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowRight, Check, ShoppingBag, Hammer } from "lucide-react";

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const intent = params.get("intent");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      toast.success("Bienvenue sur Hustart !");
      nav(intent === "shop" ? "/onboarding-shop" : "/onboarding");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const features = intent === "shop"
    ? ["Catalogue illimité avec variantes", "Paiement Stripe sécurisé", "Livraison configurable", "Gestion des commandes intégrée"]
    : ["Pas besoin de compétences techniques", "Génération IA en français", "SEO local optimisé", "Capture de leads incluse"];

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F4F6FB]" data-testid="signup-page">
      {/* Form side */}
      <div className="flex items-center justify-center p-8 md:p-16 relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12">
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="signup-logo">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">H</span>
            </div>
            <span className="font-display font-semibold text-[16px] tracking-tight">Hustart</span>
          </Link>
        </div>

        <div className="w-full max-w-md fade-up">          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            {intent === "shop" ? (
              <>Lancez votre <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">boutique</span>.</>
            ) : (
              <>Créons votre <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">compte</span>.</>
            )}
          </h1>
          <p className="text-[#6B7280] mb-10 text-[15px] leading-relaxed">
            {intent === "shop" ? "Catalogue, panier et paiement Stripe en quelques clics." : "Gratuit, sans carte bancaire requise."}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label className="text-xs font-semibold text-[#6B7280]">Nom complet</Label>
              <Input
                data-testid="signup-name"
                required
                value={form.full_name}
                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                placeholder="Marc Dupont"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#6B7280]">Email</Label>
              <Input
                data-testid="signup-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                placeholder="vous@exemple.fr"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#6B7280]">Mot de passe</Label>
              <Input
                data-testid="signup-password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                placeholder="Min. 6 caractères"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="signup-submit"
              data-umami-event="signup-submit"
              size="lg"
              className="w-full rounded-full h-13 font-semibold text-white border-0 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
              style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
            >
              {loading ? "Création..." : <>Créer mon compte <ArrowRight className="ml-1 w-4 h-4" /></>}
            </Button>
          </form>
          <p className="mt-8 text-sm text-[#6B7280]">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="font-semibold underline underline-offset-4 decoration-2"
              style={{ color: "#4F46E5" }}
              data-testid="signup-to-login"
            >
              Connectez-vous →
            </Link>
          </p>
        </div>
      </div>

      {/* Editorial side */}
      <div className="hidden md:flex items-center justify-center bg-[#0B0F1E] text-white p-16 relative overflow-hidden">
        <div className="absolute w-[360px] h-[360px] rounded-full bg-[#4F46E5] opacity-[0.22] blur-[80px] -top-24 -right-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute w-[280px] h-[280px] rounded-full bg-[#22D3EE] opacity-[0.2] blur-[80px] -bottom-16 left-[8%] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-12 right-12 text-xs font-mono uppercase tracking-widest text-white/40">
          [ {intent === "shop" ? "BOUTIQUE" : "SITE"} ] · ONBOARDING
        </div>
        <div className="absolute bottom-12 right-12 text-xs font-mono uppercase tracking-widest text-white/40">
          {new Date().getFullYear()} · © HUSTART
        </div>

        <div className="relative max-w-md z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 rounded-full mb-8">
            {intent === "shop" ? <ShoppingBag className="w-3 h-3" style={{ color: "#22D3EE" }} /> : <Hammer className="w-3 h-3" style={{ color: "#22D3EE" }} />}
            <span className="text-xs font-semibold text-white/80">
              {intent === "shop" ? "Open 24/7" : "5 minutes top chrono"}
            </span>
          </div>
          <h2 className="font-display font-bold text-5xl tracking-tight leading-[1.05] mb-8">
            {intent === "shop" ? (
              <>Une vraie<br /><span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">boutique</span> en ligne.</>
            ) : (
              <>Dans 5 minutes,<br /><span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">votre site</span> est en ligne.</>
            )}
          </h2>
          <div className="h-1 w-16 rounded-full mb-6" style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }} />
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-white/85">
                <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#22D3EE" }} />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
