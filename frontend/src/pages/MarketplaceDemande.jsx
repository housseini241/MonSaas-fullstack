import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, ArrowRight, Check, Loader2, Send, Home, Building,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRADES = [
  "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
  "Chauffage", "Couverture", "Carrelage", "Paysagiste", "Serrurerie",
  "Plâtrerie", "Rénovation", "Climatisation", "Jardinage", "Nettoyage",
];

const LOGEMENTS = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "local_pro", label: "Local professionnel" },
  { value: "autre", label: "Autre" },
];

const URGENCES = [
  { value: "normal", label: "Normal", desc: "Sous 2-3 semaines" },
  { value: "urgent", label: "Urgent", desc: "Sous 1 semaine" },
  { value: "tres_urgent", label: "Très urgent", desc: "Sous 48h" },
];

export default function MarketplaceDemande() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const artisanSlug = searchParams.get("artisan");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [artisanInfo, setArtisanInfo] = useState(null);

  const [form, setForm] = useState({
    besoin: "",
    urgence: "normal",
    city: "",
    code_postal: "",
    type_logement: "",
    name: "",
    email: "",
    phone: "",
    artisan_slug: artisanSlug || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load artisan info if pre-selected
  useEffect(() => {
    if (artisanSlug) {
      axios.get(`${API}/public/artisans/${artisanSlug}`)
        .then(r => setArtisanInfo(r.data))
        .catch(() => {});
    }
  }, [artisanSlug]);

  const canProceed = () => {
    if (step === 1) return form.besoin.length >= 10;
    if (step === 2) return form.city.length >= 2;
    if (step === 3) return form.name.length >= 2 && form.email.length >= 5;
    return false;
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/public/marketplace/demandes`, form);
      setSubmitted(true);
      toast.success("Demande envoyée avec succès !");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-[#F4F6FB]" data-testid="marketplace-demande">
      {/* Header */}
      <header className="border-b border-[#E4E8F1] bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to={artisanSlug ? `/marketplace/artisan/${artisanSlug}` : "/marketplace"} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center">
              <span className="text-white font-display font-semibold text-sm">H</span>
            </div>
            <span className="font-display font-semibold text-sm tracking-tight text-[#0F1222]">HuStart</span>
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">
            {!submitted && <>étape {step} / {totalSteps}</>}
          </div>
        </div>
        {/* Progress bar */}
        {!submitted && (
          <div className="h-1 bg-black/5">
            <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {submitted ? (
          /* Confirmation */
          <div className="text-center bg-white border border-[#E4E8F1] rounded-2xl p-10 md:p-14" data-testid="demande-confirmation">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-display font-semibold text-3xl tracking-tight text-[#0F1222] mb-3">
              Demande envoyée !
            </h2>
            <p className="text-[#6B7280] text-base max-w-md mx-auto mb-2">
              Votre demande a été transmise aux artisans de votre zone.
            </p>
            {artisanInfo && (
              <p className="text-[#6B7280] text-sm mb-6">
                <strong className="text-[#0F1222]">{artisanInfo.business_name}</strong> a reçu votre demande et vous répondra sous 24h.
              </p>
            )}
            <p className="text-[#6B7280] text-sm mb-8">
              Vous recevrez une réponse par email à : <strong className="text-[#0F1222]">{form.email}</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={artisanSlug ? `/marketplace/artisan/${artisanSlug}` : "/marketplace"}>
                <Button variant="outline" className="rounded-xl">Retour à l'annuaire</Button>
              </Link>
              <Link to="/marketplace">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl">Accueil marketplace</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* En-tête */}
            <div className="mb-10">
              <Link
                to={artisanSlug ? `/marketplace/artisan/${artisanSlug}` : "/marketplace"}
                className="inline-flex items-center gap-1 text-sm text-[#4A4F6B] hover:text-[#0F1222] mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </Link>
              <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-[#0F1222] mb-2">
                Demande de devis
              </h1>
              {artisanInfo ? (
                <p className="text-[#6B7280]">
                  Votre demande sera envoyée directement à <strong className="text-[#0F1222]">{artisanInfo.business_name}</strong> — {artisanInfo.business_type} à {artisanInfo.city}
                </p>
              ) : (
                <p className="text-[#6B7280]">Décrivez votre besoin. Les artisans de votre zone vous répondront.</p>
              )}
            </div>

            {/* Step 1 — Le besoin */}
            {step === 1 && (
              <section data-testid="demande-step-1" className="space-y-6">
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Quel type de travaux ? <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.type_travaux || ""} onValueChange={(v) => set("type_travaux", v)}>
                    <SelectTrigger className="h-12 bg-white border-[#E4E8F1] rounded-xl" data-testid="dd-type-travaux">
                      <SelectValue placeholder="Sélectionnez un métier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Je ne sais pas encore</SelectItem>
                      {TRADES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Décrivez votre besoin <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={form.besoin}
                    onChange={(e) => set("besoin", e.target.value)}
                    rows={5}
                    className="bg-white border-[#E4E8F1] rounded-xl"
                    placeholder="Ex : Rénovation complète de salle de bain 6m², pose de carrelage au sol et faïence murale..."
                    data-testid="dd-besoin"
                  />
                  <div className="text-[11px] text-[#6B7280] mt-1 font-mono">{form.besoin.length}/2000</div>
                </div>

                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-3 block">
                    Urgence
                  </Label>
                  <RadioGroup value={form.urgence} onValueChange={(v) => set("urgence", v)} className="grid md:grid-cols-3 gap-3">
                    {URGENCES.map(u => (
                      <label key={u.value} className={`flex flex-col gap-1 p-4 border rounded-xl cursor-pointer transition-colors ${
                        form.urgence === u.value ? "border-[#0F1222] bg-[#0F1222] text-white" : "border-[#E4E8F1] bg-white hover:border-ink-2"
                      }`}>
                        <RadioGroupItem value={u.value} className="sr-only" />
                        <span className="font-medium text-sm">{u.label}</span>
                        <span className={`text-[11px] ${form.urgence === u.value ? "text-white/70" : "text-[#6B7280]"}`}>{u.desc}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </section>
            )}

            {/* Step 2 — Localisation */}
            {step === 2 && (
              <section data-testid="demande-step-2" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                      Ville <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className="h-12 bg-white border-[#E4E8F1] rounded-xl"
                      placeholder="Lyon"
                      data-testid="dd-city"
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                      Code postal
                    </Label>
                    <Input
                      value={form.code_postal}
                      onChange={(e) => set("code_postal", e.target.value)}
                      className="h-12 bg-white border-[#E4E8F1] rounded-xl"
                      placeholder="69000"
                      data-testid="dd-cp"
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Type de logement
                  </Label>
                  <Select value={form.type_logement} onValueChange={(v) => set("type_logement", v)}>
                    <SelectTrigger className="h-12 bg-white border-[#E4E8F1] rounded-xl" data-testid="dd-logement">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGEMENTS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {/* Step 3 — Coordonnées */}
            {step === 3 && (
              <section data-testid="demande-step-3" className="space-y-6">
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="h-12 bg-white border-[#E4E8F1] rounded-xl"
                    placeholder="Jean Dupont"
                    data-testid="dd-name"
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="h-12 bg-white border-[#E4E8F1] rounded-xl"
                    placeholder="jean@exemple.fr"
                    data-testid="dd-email"
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">
                    Téléphone
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="h-12 bg-white border-[#E4E8F1] rounded-xl"
                    placeholder="06 12 34 56 78"
                    data-testid="dd-phone"
                  />
                </div>
              </section>
            )}

            {/* Navigation buttons */}
            <div className="mt-12 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(step - 1) : nav(artisanSlug ? `/marketplace/artisan/${artisanSlug}` : "/marketplace")}
                className="rounded-xl"
                data-testid="dd-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> {step > 1 ? "Précédent" : "Annuler"}
              </Button>

              {step < totalSteps ? (
                <Button
                  disabled={!canProceed()}
                  onClick={() => setStep(step + 1)}
                  className="rounded-xl h-12 px-6 bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white"
                  data-testid="dd-next"
                >
                  Continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  disabled={!canProceed() || submitting}
                  onClick={handleSubmit}
                  className="rounded-xl h-12 px-6 bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white"
                  data-testid="dd-submit"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Envoyer ma demande</>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}