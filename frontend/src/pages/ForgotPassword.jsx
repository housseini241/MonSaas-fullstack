import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Hammer } from "lucide-react";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F4F6FB]" data-testid="forgot-password-page">
      <div className="flex items-center justify-center p-8 md:p-16 relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Hustart" className="w-9 h-9 object-contain" />
            <span className="font-display font-semibold text-[16px] tracking-tight">HuStart</span>
          </Link>
        </div>

        <div className="w-full max-w-md fade-up">
          {sent ? (
            <>
              <h1 className="font-display text-3xl font-bold tracking-tight mb-3">Email envoyé<span style={{ color: "#22D3EE" }}>.</span></h1>
              <p className="text-[#6B7280] mb-8 text-[15px] leading-relaxed">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous allez recevoir un lien de réinitialisation d'ici quelques minutes.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-sm" style={{ color: "#4F46E5" }}>
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
                Mot de passe oublié<span style={{ color: "#22D3EE" }}>?</span>
              </h1>
              <p className="text-[#6B7280] mb-10 text-[15px] leading-relaxed">
                Indiquez votre email, on vous envoie un lien pour le réinitialiser.
              </p>
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-[#6B7280]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 rounded-xl border-[1.5px] border-[#E4E8F1] h-12 focus-visible:ring-[#4F46E5]"
                    placeholder="vous@exemple.fr"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full rounded-full h-13 font-semibold text-white border-0 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(79,70,229,0.22)]"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  {loading ? "Envoi..." : <>Envoyer le lien <ArrowRight className="ml-1 w-4 h-4" /></>}
                </Button>
              </form>
              <p className="mt-8 text-sm text-[#6B7280]">
                <Link to="/login" className="font-semibold underline underline-offset-4 decoration-2" style={{ color: "#4F46E5" }}>
                  ← Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center justify-center bg-[#0B0F1E] text-white p-16 relative overflow-hidden">
        <div className="absolute w-[360px] h-[360px] rounded-full bg-[#4F46E5] opacity-[0.22] blur-[80px] -top-24 -right-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute w-[280px] h-[280px] rounded-full bg-[#22D3EE] opacity-[0.2] blur-[80px] -bottom-16 left-[8%] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-md z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 rounded-full mb-8">
            <Hammer className="w-3 h-3" style={{ color: "#22D3EE" }} />
            <span className="text-xs font-semibold text-white/80">+1 200 artisans</span>
          </div>
          <h2 className="font-display font-bold text-4xl tracking-tight leading-[1.05] mb-8">
            Un lien sécurisé,<br />valable <span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">30 minutes.</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
