import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, MapPin, Briefcase, Star, ArrowRight, Shield, FileText, Percent, Hammer, ChevronRight, LocateFixed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRADES = [
  { id: "Plomberie" },
  { id: "Électricité" },
  { id: "Maçonnerie" },
  { id: "Peinture" },
  { id: "Menuiserie" },
  { id: "Chauffage" },
  { id: "Couverture" },
  { id: "Carrelage" },
  { id: "Paysagiste" },
  { id: "Serrurerie" },
  { id: "Plâtrerie" },
  { id: "Rénovation" },
  { id: "Climatisation" },
  { id: "Jardinage" },
  { id: "Nettoyage" },
];

export default function MarketplaceLanding() {
  const nav = useNavigate();
  const [trades, setTrades] = useState(TRADES);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [city, setCity] = useState("");

  // Proximité / région
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | granted | denied
  const [nearby, setNearby] = useState([]);
  const [regions, setRegions] = useState([]);

  // Profils mis en avant (structure prête, boost payant à venir)
  const [boosted, setBoosted] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/trades`).then(r => {
      if (r.data?.trades) {
        setTrades(r.data.trades.map(t => ({ id: t })));
      }
    }).catch(() => {});

    axios.get(`${API}/public/artisans/regions`).then(r => setRegions(r.data || [])).catch(() => {});
    axios.get(`${API}/public/artisans/boosted`).then(r => setBoosted(r.data || [])).catch(() => {});
  }, []);

  const distanceLabel = (km) => {
    if (km < 2) return "à moins de 2 km";
    if (km < 10) return "entre 2 et 10 km";
    if (km < 30) return "entre 10 et 30 km";
    return "à plus de 30 km";
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await axios.get(`${API}/public/artisans/nearby`, {
            params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radius_km: 50 },
          });
          setNearby(r.data || []);
          setGeoStatus("granted");
        } catch {
          setGeoStatus("denied");
        }
      },
      () => setGeoStatus("denied"),
      { timeout: 8000 }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectedTrade && !city) return;
    const params = new URLSearchParams();
    if (selectedTrade) params.set("business_type", selectedTrade);
    if (city) params.set("city", city);
    nav(`/marketplace/artisans?${params.toString()}`);
  };

  const handleRegionClick = (region) => {
    nav(`/marketplace/artisans?region=${encodeURIComponent(region)}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB]" data-testid="marketplace-landing">
      {/* Navigation simplifiée */}
      <header className="sticky top-4 z-30 px-4">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border border-[#E4E8F1] rounded-full h-14 sm:h-16 pl-3 sm:pl-5 pr-1.5 sm:pr-2 flex items-center justify-between gap-2 shadow-[0_8px_24px_rgba(20,25,60,0.07)]">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="Hustart" className="w-8 h-8 shrink-0 object-contain" />
            <span className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-display font-semibold text-sm tracking-tight text-[#0F1222] leading-none truncate">HuStart</span>
              <span className="hidden sm:inline font-mono text-[10px] tracking-[0.2em] text-[#4F46E5] leading-none">marketplace</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link to="/avis" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="rounded-full text-[#4A4F6B] text-sm leading-none">Avis</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm" className="rounded-full border-[1.5px] border-[#E4E8F1] text-xs sm:text-sm leading-none whitespace-nowrap px-3 sm:px-4">Connexion</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero avec barre de recherche */}
      <section className="relative bg-[#0B0F1E] text-white overflow-hidden pt-24 pb-28 md:pt-32 md:pb-36">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-[#4F46E5] opacity-[0.25] blur-[90px] -top-28 -right-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#22D3EE] opacity-[0.25] blur-[90px] -bottom-16 left-[8%] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#22D3EE] border border-[#22D3EE]/30 px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#22D3EE] rounded-full animate-pulse" />
            Annuaire d'artisans de confiance
          </div>
          <h1 className="font-display font-bold text-[40px] md:text-[60px] leading-[1.05] tracking-tight mb-4 text-white">
            Trouvez l'artisan<br />
            <span className="bg-gradient-to-r from-[#818CF8] to-[#67E8F9] bg-clip-text text-transparent">qu'il vous faut.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-10">
            Des professionnels locaux vérifiés, des devis gratuits, zéro commission.
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-[28px] sm:rounded-full shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
              <div className="flex-1 rounded-full overflow-hidden">
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger className="h-14 border-0 rounded-full bg-transparent text-[#0F1222] text-base px-5 focus:ring-0 focus:ring-offset-0" data-testid="search-trade">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#8A90AC] shrink-0" />
                      <SelectValue placeholder="Quel métier ?" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-2xl">
                    {trades.map((t) => (
                      <SelectItem key={t.id} value={t.id} data-testid={`trade-option-${t.id}`}>
                        {t.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 rounded-full overflow-hidden flex items-center px-5">
                <MapPin className="w-4 h-4 text-[#8A90AC] shrink-0 mr-2" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Quelle ville ?"
                  className="h-14 border-0 rounded-full bg-transparent text-[#0F1222] text-base px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  data-testid="search-city"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 text-white rounded-full text-base font-semibold shrink-0 border-0 transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                disabled={!selectedTrade && !city}
                data-testid="search-submit"
              >
                Rechercher <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Près de chez vous — proximité réelle ou navigation par région */}
      <section className="py-16 md:py-20 max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-[#0F1222] mb-3">
            Près de chez vous
          </h2>
          <p className="text-[#6B7280] text-base">
            Trouvez un artisan à proximité, ou parcourez par région.
          </p>
        </div>

        {geoStatus !== "granted" && (
          <div className="flex justify-center mb-10">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={geoStatus === "loading"}
              data-testid="locate-me-btn"
              className="inline-flex items-center gap-2 bg-white border border-[#E4E8F1] rounded-full px-6 py-3 text-sm font-semibold text-[#0F1222] hover:border-[#4F46E5] hover:shadow-[0_10px_30px_rgba(20,25,60,0.08)] transition-all disabled:opacity-60"
            >
              <LocateFixed className="w-4 h-4" style={{ color: "#4F46E5" }} />
              {geoStatus === "loading" ? "Localisation en cours..." : "Utiliser ma position"}
            </button>
          </div>
        )}

        {geoStatus === "granted" ? (
          nearby.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="nearby-results">
              {nearby.map((a) => (
                <button
                  key={a.id}
                  onClick={() => nav(`/marketplace/artisan/${a.slug}`)}
                  className="flex flex-col items-start gap-1 p-4 bg-white border border-[#E4E8F1] rounded-2xl hover:border-[#4F46E5] hover:shadow-[0_10px_30px_rgba(20,25,60,0.08)] hover:-translate-y-1 transition-all text-left"
                >
                  <span className="font-display font-semibold text-sm text-[#0F1222] truncate w-full">{a.business_name}</span>
                  <span className="text-xs text-[#6B7280]">{a.business_type} · {a.city}</span>
                  <span className="text-xs font-semibold" style={{ color: "#4F46E5" }}>{distanceLabel(a.distance_km)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[#6B7280]">Aucun artisan trouvé à proximité pour l'instant.</p>
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="region-grid">
            {regions.length > 0 ? (
              regions.map((r) => (
                <button
                  key={r.region}
                  onClick={() => handleRegionClick(r.region)}
                  className="flex flex-col items-center gap-1 p-5 bg-white border border-[#E4E8F1] rounded-2xl hover:border-[#4F46E5] hover:shadow-[0_10px_30px_rgba(20,25,60,0.08)] hover:-translate-y-1 transition-all cursor-pointer"
                  data-testid={`region-card-${r.region}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#4A4F6B] text-center leading-tight">{r.region}</span>
                  <span className="text-xs text-[#6B7280]">{r.count} artisan{r.count > 1 ? "s" : ""}</span>
                </button>
              ))
            ) : (
              <p className="col-span-full text-center text-sm text-[#6B7280]">Les régions apparaîtront ici dès les premiers artisans inscrits.</p>
            )}
          </div>
        )}
      </section>

      {/* Profils tendance — pas de mention "boost" côté visiteur, le badge Sponsorisé suffit.
          Section masquée entièrement tant qu'il n'y a aucun profil (rien à afficher = rien). */}
      {boosted.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8 mb-8">
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-[#0F1222] mb-3">
              Tendance en ce moment
            </h2>
            <p className="text-[#6B7280] text-base">Une sélection de professionnels à découvrir.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-2 snap-x snap-mandatory scrollbar-hide" data-testid="boosted-slider">
            {boosted.map((a) => (
              <button
                key={a.id}
                onClick={() => nav(`/marketplace/artisan/${a.slug}`)}
                className="relative shrink-0 w-64 snap-start flex flex-col items-start gap-1 p-5 bg-white border border-[#E4E8F1] rounded-2xl hover:shadow-[0_10px_30px_rgba(20,25,60,0.08)] hover:-translate-y-1 transition-all text-left"
              >
                <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}>
                  <Sparkles className="w-3 h-3" /> Sponsorisé
                </span>
                <span className="font-display font-semibold text-sm text-[#0F1222] truncate w-full mt-1">{a.business_name}</span>
                <span className="text-xs text-[#6B7280]">{a.business_type} · {a.city}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pourquoi nous */}
      <section className="bg-white border-y border-[#E4E8F1] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-[#0F1222] text-center mb-12">
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">Pourquoi</span> passer par nous ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Artisans vérifiés", desc: "Chaque professionnel est validé avant d'apparaître dans l'annuaire. Pas de surprise." },
              { icon: FileText, title: "Devis gratuit", desc: "Recevez jusqu'à 3 propositions sans engagement. Comparez et choisissez." },
              { icon: Percent, title: "0 commission", desc: "Nous ne prenons aucune commission sur vos chantiers. Le prix est celui de l'artisan." },
            ].map((item, i) => (
              <div key={i} className="text-center md:text-left bg-[#F4F6FB] rounded-2xl p-7">
                <div
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center mx-auto md:mx-0 mb-4"
                  style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-[#0F1222] mb-2">{item.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Artisan */}
      <section className="py-16 md:py-20 max-w-5xl mx-auto px-4 md:px-8 text-center">
        <div className="relative bg-[#0B0F1E] text-white p-10 md:p-14 rounded-[28px] overflow-hidden">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#4F46E5] opacity-[0.25] blur-[80px] -top-16 -right-16 pointer-events-none" aria-hidden="true" />
          <div
            className="relative w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
          >
            <Hammer className="w-6 h-6" />
          </div>
          <h2 className="relative font-display font-bold text-3xl md:text-4xl tracking-tight mb-3 text-white">
            Vous êtes artisan ?
          </h2>
          <p className="relative text-white/70 text-base max-w-lg mx-auto mb-8">
            Rejoignez la marketplace et soyez trouvé par des clients près de chez vous. Gratuit pour les membres Pro.
          </p>
          <div className="relative flex justify-center">
            <Link to="/signup">
              <Button
                className="text-white h-14 px-8 text-base rounded-full border-0 transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
              >
                Créer mon compte artisan <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E8F1] bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A90AC]">
            © {new Date().getFullYear()} HuStart · marketplace
          </div>
          <div className="flex gap-6 text-xs font-mono uppercase tracking-[0.2em] text-[#8A90AC]">
            <Link to="/avis" className="hover:text-[#4F46E5] transition-colors">Avis clients</Link>
            <Link to="/" className="hover:text-[#4F46E5] transition-colors">Hustart</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}