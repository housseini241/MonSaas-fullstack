import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  Search, MapPin, Briefcase, ArrowRight, Star, Filter, X, 
  ChevronLeft, ChevronRight, Check, Loader2, Phone, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { resolveImg } from "@/lib/api";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRADES = [
  "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
  "Chauffage", "Couverture", "Carrelage", "Paysagiste", "Serrurerie",
  "Plâtrerie", "Rénovation", "Climatisation", "Jardinage", "Nettoyage",
];

function ArtisanCard({ artisan }) {
  return (
    <div className="bg-white border border-[#E4E8F1] rounded-2xl overflow-hidden group hover:shadow-md transition-shadow" data-testid={`artisan-card-${artisan.slug}`}>
      {/* Hero image */}
      <div className="aspect-[16/9] bg-[#F4F6FB] relative overflow-hidden">
        {artisan.hero_image_url ? (
          <img src={resolveImg(artisan.hero_image_url)} alt={artisan.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B7280] bg-[#F4F6FB]">
            <Briefcase className="w-10 h-10" />
          </div>
        )}
        {artisan.verified && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] text-white text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-xl flex items-center gap-1">
            <Check className="w-3 h-3" /> Pro vérifié
          </div>
        )}
        {artisan.disponibilite === "disponible" && (
          <div className="absolute top-3 left-3 bg-success text-white text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-xl flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Disponible
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        <h3 className="font-display font-semibold text-lg tracking-tight text-[#0F1222] truncate">
          {artisan.business_name}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6B7280] mt-1">
          {artisan.business_type}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-sm text-[#4A4F6B]">
          <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>{artisan.city}</span>
        </div>

        {/* Services preview */}
        {artisan.services && artisan.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {artisan.services.slice(0, 3).map((svc, i) => (
              <span key={i} className="text-[10px] font-mono bg-[#F4F6FB] text-[#4A4F6B] px-2 py-0.5 rounded-xl">
                {svc}
              </span>
            ))}
            {artisan.services.length > 3 && (
              <span className="text-[10px] font-mono text-[#6B7280]">+{artisan.services.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link to={`/marketplace/artisan/${artisan.slug}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full rounded-xl border-[#E4E8F1] text-sm">
              Voir le profil
            </Button>
          </Link>
          <Link to={`/marketplace/demande?artisan=${artisan.slug}`} className="flex-1">
            <Button size="sm" className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white text-sm">
              Demander un devis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceDirectory() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL
  const [businessType, setBusinessType] = useState(searchParams.get("business_type") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [disponibleOnly, setDisponibleOnly] = useState(searchParams.get("disponible") === "true");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");

  // State
  const [artisans, setArtisans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(city);

  const loadArtisans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (businessType) params.set("business_type", businessType);
      if (city) params.set("city", city);
      if (disponibleOnly) params.set("disponible", "true");
      if (verifiedOnly) params.set("verified", "true");
      params.set("page", String(page));
      params.set("limit", "12");

      // Update URL
      setSearchParams(params, { replace: true });

      const r = await axios.get(`${API}/public/artisans?${params.toString()}`);
      setArtisans(r.data.artisans || []);
      setTotal(r.data.total || 0);
      setTotalPages(r.data.total_pages || 1);
    } catch (e) {
      setError("Impossible de charger les artisans");
      setArtisans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtisans();
  }, [page]);

  // Reload on filter change (reset to page 1)
  const applyFilters = () => {
    setPage(1);
    loadArtisans();
  };

  // Sync search on city + businessType change
  useEffect(() => {
    setSearchInput(city);
  }, [city]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadArtisans();
  };

  const clearFilters = () => {
    setBusinessType("");
    setCity("");
    setDisponibleOnly(false);
    setVerifiedOnly(false);
    setPage(1);
    setSearchInput("");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = businessType || city || disponibleOnly || verifiedOnly;

  return (
    <div className="min-h-screen bg-[#F4F6FB]" data-testid="marketplace-directory">
      {/* Header */}
      <header className="border-b border-[#E4E8F1] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/marketplace" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center">
                <span className="text-white font-display font-semibold text-sm">H</span>
              </div>
              <span className="font-display font-semibold text-sm tracking-tight text-[#0F1222] hidden sm:inline">HuStart</span>
            </Link>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#4F46E5]">annuaire</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filter drawer trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden rounded-xl" data-testid="mobile-filters-btn">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtres
                  {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-[#4F46E5] rounded-full" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80" data-testid="mobile-filters-panel">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl">Filtres</SheetTitle>
                </SheetHeader>
                <MobileFilters
                  businessType={businessType}
                  setBusinessType={setBusinessType}
                  city={city}
                  setCity={setCity}
                  disponibleOnly={disponibleOnly}
                  setDisponibleOnly={setDisponibleOnly}
                  verifiedOnly={verifiedOnly}
                  setVerifiedOnly={setVerifiedOnly}
                  onApply={() => { setPage(1); loadArtisans(); }}
                />
              </SheetContent>
            </Sheet>
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" className="text-[#4A4F6B]">← Retour</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Sidebar filtres (desktop) */}
          <aside className="hidden lg:block w-72 shrink-0 border-r border-[#E4E8F1] bg-white min-h-screen p-6 sticky top-16 self-start">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg tracking-tight text-[#0F1222]">Filtres</h2>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-[#4F46E5] hover:text-[#4F46E5]-dark font-mono uppercase tracking-[0.15em]">
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Métier */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">Métier</Label>
                <div className="space-y-2">
                  {TRADES.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-[#4A4F6B] hover:text-[#0F1222]">
                      <Checkbox
                        checked={businessType === t}
                        onCheckedChange={(checked) => {
                          setBusinessType(checked ? t : "");
                        }}
                        data-testid={`filter-trade-${t}`}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ville */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">Ville</Label>
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onBlur={() => setCity(searchInput)}
                  placeholder="Paris, Lyon..."
                  className="h-10 rounded-xl border-[#E4E8F1]"
                  data-testid="filter-city"
                />
              </div>

              {/* Disponible */}
              <div className="flex items-center justify-between">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] cursor-pointer">Disponible maintenant</Label>
                <Switch
                  checked={disponibleOnly}
                  onCheckedChange={setDisponibleOnly}
                  data-testid="filter-disponible"
                />
              </div>

              {/* Vérifié */}
              <div className="flex items-center justify-between">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] cursor-pointer">Pro vérifié</Label>
                <Switch
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                  data-testid="filter-verified"
                />
              </div>

              <Button
                onClick={() => { setPage(1); loadArtisans(); }}
                className="w-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl"
                data-testid="filter-apply"
              >
                Appliquer les filtres
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 p-4 md:p-8">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select value={businessType} onValueChange={(v) => { setBusinessType(v); }}>
                    <SelectTrigger className="h-12 bg-white border-[#E4E8F1] rounded-xl" data-testid="directory-trade">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#6B7280] shrink-0" />
                        <SelectValue placeholder="Tous les métiers" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {TRADES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center bg-white border border-[#E4E8F1] rounded-xl px-3">
                  <MapPin className="w-4 h-4 text-[#6B7280] shrink-0 mr-2" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Ville"
                    className="h-12 border-0 rounded-xl px-0 focus-visible:ring-0"
                    data-testid="directory-city"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 px-6 bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl shrink-0"
                  data-testid="directory-search"
                >
                  <Search className="w-4 h-4 mr-2" /> Rechercher
                </Button>
              </div>
            </form>

            {/* Active filters chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6B7280]">Filtres actifs :</span>
                {businessType && (
                  <Badge variant="outline" className="rounded-xl text-xs px-2 py-1">
                    {businessType}
                    <button onClick={() => setBusinessType("")} className="ml-1.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {city && (
                  <Badge variant="outline" className="rounded-xl text-xs px-2 py-1">
                    {city}
                    <button onClick={() => { setCity(""); setSearchInput(""); }} className="ml-1.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {disponibleOnly && (
                  <Badge variant="success" className="rounded-xl text-xs px-2 py-1">
                    Disponible
                    <button onClick={() => setDisponibleOnly(false)} className="ml-1.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {verifiedOnly && (
                  <Badge variant="default" className="rounded-xl text-xs px-2 py-1 bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] text-white">
                    Pro vérifié
                    <button onClick={() => setVerifiedOnly(false)} className="ml-1.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                <button onClick={clearFilters} className="text-xs text-[#6B7280] hover:text-[#4F46E5] font-mono uppercase tracking-[0.15em] ml-2">
                  Tout effacer
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-[#6B7280]">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Recherche...</span>
                ) : (
                  <span><strong className="text-[#0F1222]">{total}</strong> artisan{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm mb-6">{error}</div>
            )}

            {/* Results grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
              </div>
            ) : artisans.length === 0 ? (
              <div className="text-center py-24 border border-[#E4E8F1] bg-white rounded-2xl">
                <div className="w-14 h-14 bg-[#F4F6FB] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-[#6B7280]" />
                </div>
                <h3 className="font-display text-xl text-[#0F1222] mb-2">Aucun artisan trouvé</h3>
                <p className="text-[#6B7280] text-sm mb-6">Essayez d'élargir vos critères de recherche.</p>
                <Button variant="outline" onClick={clearFilters} className="rounded-xl">Réinitialiser les filtres</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {artisans.map((a) => (
                    <ArtisanCard key={a.slug || a.id} artisan={a} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10" data-testid="pagination">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const startPage = Math.max(1, page - 2);
                      const p = startPage + i;
                      if (p > totalPages) return null;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`rounded-xl min-w-[36px] ${p === page ? "bg-[#0F1222] text-white" : ""}`}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="rounded-xl"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function MobileFilters({ businessType, setBusinessType, city, setCity, disponibleOnly, setDisponibleOnly, verifiedOnly, setVerifiedOnly, onApply }) {
  const [localCity, setLocalCity] = useState(city);
  return (
    <div className="space-y-6 mt-6">
      <div>
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">Métier</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {TRADES.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox checked={businessType === t} onCheckedChange={(c) => setBusinessType(c ? t : "")} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-2 block">Ville</Label>
        <Input value={localCity} onChange={(e) => setLocalCity(e.target.value)} placeholder="Paris, Lyon..." className="h-10 rounded-xl" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] cursor-pointer">Disponible maintenant</Label>
        <Switch checked={disponibleOnly} onCheckedChange={setDisponibleOnly} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] cursor-pointer">Pro vérifié</Label>
        <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>
      <SheetClose asChild>
        <Button onClick={() => { setCity(localCity); onApply(); }} className="w-full bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] hover:opacity-90 text-white rounded-xl">
          Appliquer les filtres
        </Button>
      </SheetClose>
    </div>
  );
}