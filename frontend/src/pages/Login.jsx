import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowRight, Hammer } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Bienvenue !");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F4F6FB]" data-testid="login-page">
      {/* Form side */}
      <div className="flex items-center justify-center p-8 md:p-16 relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12">
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="login-logo">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">H</span>
              </div>

            <span className="font-display font-semibold text-[16px] tracking-tight">HuStart</span>
          </Link>
        </div>

        <div className="w-full max-w-md fade-up">          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            Bon retour<span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">.</span>
          </h1>
          <p className="text-[#6B7280] mb-10 text-[15px] leading-relaxed">
            Connectez-vous pour piloter vos sites, devis et clients.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-[#6B7280]">Email</Label>
              <Input
                id="email"
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                placeholder="vous@exemple.fr"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-semibold text-[#6B7280]">Mot de passe</Label>
              <Input
                id="password"
                data-testid="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              size="lg"
              className="w-full rounded-full h-13 font-semibold text-white border-0 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
              style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
            >
              {loading ? "Connexion..." : <>Se connecter <ArrowRight className="ml-1 w-4 h-4" /></>}
            </Button>
          </form>
          <p className="mt-8 text-sm text-[#6B7280]">
            Pas de compte ?{" "}
            <Link
              to="/signup"
              className="font-semibold underline underline-offset-4 decoration-2"
              style={{ color: "#4F46E5" }}
              data-testid="login-to-signup"
            >
              Créez-en un gratuitement →
            </Link>
          </p>
        </div>
      </div>

      {/* Editorial side */}
      <div className="hidden md:flex items-center justify-center bg-[#0B0F1E] text-white p-16 relative overflow-hidden">
        <div className="absolute w-[360px] h-[360px] rounded-full bg-[#4F46E5] opacity-[0.22] blur-[80px] -top-24 -right-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute w-[280px] h-[280px] rounded-full bg-[#22D3EE] opacity-[0.2] blur-[80px] -bottom-16 left-[8%] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-12 right-12 text-xs font-mono uppercase tracking-widest text-white/40">SAAS · INDEX</div>
        <div className="absolute bottom-12 right-12 text-xs font-mono uppercase tracking-widest text-white/40">
          {new Date().getFullYear()} · © HUSTART
        </div>
        <div className="relative max-w-md z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 rounded-full mb-8">
            <Hammer className="w-3 h-3" style={{ color: "#22D3EE" }} />
            <span className="text-xs font-semibold text-white/80">+1 200 artisans</span>
          </div>
          <h2 className="font-display font-bold text-5xl tracking-tight leading-[1.05] mb-8">
            Le site web,<br />
            ce n'est pas <br />
            votre métier.<br />
            <span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">C'est le nôtre.</span>
          </h2>
          <div className="h-1 w-16 rounded-full mb-6" style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }} />
          <p className="text-white/70 leading-relaxed text-[15px]">
            Devis, contacts, visibilité locale, boutique en ligne — chaque outil pensé pour la précision d'un artisan.
          </p>
        </div>
      </div>
    </div>
  );
}