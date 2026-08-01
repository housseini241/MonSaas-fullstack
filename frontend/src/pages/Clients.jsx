import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Mail, Phone, MapPin, Users } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function Clients() {
  const nav = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const r = await api.get("/artisan/clients", {
        params: searchQuery ? { search: searchQuery } : {},
      });
      setClients(r.data);
    } catch (e) {
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <AppShell
      title={<>Vos <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">clients</span>.</>}
      actions={
        <Button onClick={() => nav("/clients/nouveau")} data-testid="add-client-btn" className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      }
    >
      <div className="space-y-6" data-testid="clients-page">
        <div className="sm:hidden">
          <Button onClick={() => nav("/clients/nouveau")} className="w-full" size="lg">
            <Plus className="w-4 h-4" /> Ajouter un client
          </Button>
        </div>

        {/* Search bar */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl p-4 shadow-sm flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadClients()}
              placeholder="Rechercher un client (nom, email, téléphone)…"
              className="pl-10 border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-11"
              data-testid="search-input"
            />
          </div>
          <Button onClick={loadClients} variant="outline" data-testid="search-btn">
            Rechercher
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 flex items-center justify-center text-[#6B7280] font-mono text-sm">
            <span className="cursor-blink">Chargement</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white border border-[#E4E8F1] rounded-2xl p-12 text-center shadow-sm" data-testid="empty-clients">
            <div className="w-14 h-14 mx-auto bg-[#EEF0FE] text-[#4F46E5] rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-display text-display-m mb-2">
              {searchQuery ? "Aucun résultat" : "Aucun client"}
            </h2>
            <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-6">
              {searchQuery
                ? "Aucun client ne correspond à votre recherche."
                : "Commencez par ajouter votre premier client."}
            </p>
            {!searchQuery && (
              <Button onClick={() => nav("/clients/nouveau")}>
                <Plus className="w-4 h-4" /> Ajouter mon premier client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, idx) => {
              const initials = (client.prenom?.[0] || client.nom?.[0] || "?").toUpperCase();
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => nav(`/clients/${client.id}`)}
                  className="group text-left bg-white border border-[#E4E8F1] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#0F1222]/20 transition-all duration-200"
                  data-testid={`client-card-${client.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-semibold text-lg text-white" style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}>
                      {initials}
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-lg tracking-tight truncate text-[#0F1222]">
                    {client.prenom} {client.nom}
                  </h3>
                  <div className="mt-3 space-y-1.5 text-sm text-[#6B7280]">
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{client.telephone}</span>
                      </div>
                    )}
                    {client.ville && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.ville}</span>
                      </div>
                    )}
                  </div>
                  {client.notes && (
                    <p className="mt-4 text-xs text-[#6B7280] line-clamp-2 border-t border-[#E4E8F1] pt-3">
                      {client.notes}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}