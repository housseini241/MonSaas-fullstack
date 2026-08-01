import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, MapPin, Edit, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function ClientDetail() {
  const { clientId } = useParams();
  const nav = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadClient(); }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/artisan/clients/${clientId}`);
      setClient(r.data);
    } catch (e) {
      toast.error("Client introuvable");
      nav("/clients");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !client) {
    return (
      <AppShell
 title=" ">
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
      </AppShell>
    );
  }

  const initials = (client.prenom?.[0] || client.nom?.[0] || "?").toUpperCase();
  const fullName = `${client.prenom || ""} ${client.nom}`.trim();

  return (
    <AppShell
      title={<>{client.prenom || "Client"} <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">{client.nom}</span></>}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => nav("/clients")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Retour</span>
          </Button>
          <Button size="sm" onClick={() => nav(`/clients/${client.id}/edit`)}>
            <Edit className="w-4 h-4" /> Modifier
          </Button>
        </div>
      }
    >
      <div className="grid md:grid-cols-12 gap-6">
        {/* Client Info card */}
        <div className="md:col-span-4">
          <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-display font-semibold text-2xl text-white" style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}>
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-xl text-[#0F1222] truncate">{fullName}</h2>              </div>
            </div>

            <div className="space-y-3 text-sm">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-[#4F46E5] hover:underline break-all">
                    {client.email}
                  </a>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <a href={`tel:${client.telephone}`} className="text-[#4F46E5] hover:underline">
                    {client.telephone}
                  </a>
                </div>
              )}
              {(client.adresse || client.ville || client.code_postal) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                  <div className="text-[#4A4F6B]">
                    {client.adresse && <div>{client.adresse}</div>}
                    <div>{client.code_postal} {client.ville}</div>
                  </div>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-5 pt-5 border-t border-[#E4E8F1]">                <p className="text-sm text-[#4A4F6B] leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="md:col-span-8 space-y-4">
          <section className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm">            <h2 className="font-display text-display-m mt-1 mb-4">Historique financier</h2>
            <div className="py-10 text-center bg-[#F4F6FB]/40 rounded-xl">
              <div className="text-[#6B7280] text-sm">Aucun devis ou facture pour ce client.</div>
            </div>
          </section>

          <section className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm">            <h2 className="font-display text-display-m mt-1 mb-4">Historique RDV</h2>
            <div className="py-10 text-center bg-[#F4F6FB]/40 rounded-xl">
              <div className="text-[#6B7280] text-sm">Aucun rendez-vous avec ce client.</div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}