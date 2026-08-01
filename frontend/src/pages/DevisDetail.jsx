import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Mail, CheckCircle, Edit, Trash2, Loader2,
} from "lucide-react";
import DevisFormModal from "@/components/DevisFormModal";
import AppShell from "@/components/AppShell";

function fmt(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(amount || 0);
}

const STATUT_VARIANTS = {
  en_attente: { label: "En attente", variant: "warning" },
  accepte:    { label: "Accepté",    variant: "success" },
  refuse:     { label: "Refusé",     variant: "destructive" },
  expire:     { label: "Expiré",     variant: "secondary" },
};

export default function DevisDetail() {
  const { devisId } = useParams();
  const nav = useNavigate();
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDevis = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/artisan/devis/${devisId}`);
      setDevis(r.data);
    } catch (e) {
      toast.error("Devis introuvable");
      nav("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevis(); }, [devisId]);

  const downloadPDF = () => {
    const token = localStorage.getItem("aw_token");
    fetch(`${API}/artisan/devis/${devisId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${devis.numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Erreur lors du téléchargement"));
  };

  const sendEmail = async () => {
    if (!window.confirm("Envoyer le devis par email au client ?")) return;
    setActionLoading(true);
    try {
      const r = await api.post(`/artisan/devis/${devisId}/send-email`);
      if (r.data.sent) toast.success(`Email envoyé à ${r.data.email}`);
      else toast.warning(r.data.reason || "Email non envoyé");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setActionLoading(false);
    }
  };

  const convertToFacture = async () => {
    if (!window.confirm("Convertir ce devis en facture ?\nLe statut du devis passera à 'Accepté'.")) return;
    setActionLoading(true);
    try {
      const r = await api.post(`/artisan/devis/${devisId}/convert-to-facture`);
      toast.success(`Facture ${r.data.numero} créée`);
      nav("/dashboard");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatut = async (newStatut) => {
    try {
      await api.put(`/artisan/devis/${devisId}`, { statut: newStatut });
      toast.success("Statut mis à jour");
      loadDevis();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const deleteDevis = async () => {
    if (!window.confirm("Supprimer définitivement ce devis ?")) return;
    try {
      await api.delete(`/artisan/devis/${devisId}`);
      toast.success("Devis supprimé");
      nav("/dashboard");
    } catch (e) {
      toast.error("Erreur");
    }
  };

  if (loading || !devis) {
    return (
      <AppShell
 title=" ">
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
      </AppShell>
    );
  }

  const statutInfo = STATUT_VARIANTS[devis.statut] || STATUT_VARIANTS.en_attente;

  return (
    <AppShell
      title={<>Devis <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">{devis.numero}</span></>}
      actions={
        <Button variant="outline" size="sm" onClick={() => nav(-1)} data-testid="back-button">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Retour</span>
        </Button>
      }
    >
      <div className="space-y-4" data-testid="devis-detail-page">
        {/* Summary card */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={statutInfo.variant}>{statutInfo.label}</Badge>
                <span className="text-sm text-[#6B7280]">
                  Créé le <span className="text-[#0F1222] font-medium">{new Date(devis.date).toLocaleDateString("fr-FR")}</span>
                </span>
                <span className="text-sm text-[#6B7280]">Validité {devis.validite_jours} jours</span>
              </div>
              <div className="mt-3 text-sm">
                                <Link
                  to={`/clients/${devis.client_id}`}
                  className="block font-display text-display-m mt-1 text-[#0F1222] hover:text-[#4F46E5] transition-colors"
                >
                  {devis.client_nom}
                </Link>
              </div>
            </div>
            <div className="text-right">
              <div className="t-label">Total TTC</div>
              <div className="font-display font-semibold text-5xl text-[#4F46E5] mt-1 leading-none">
                {fmt(devis.montant_ttc)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-5 border-t border-[#E4E8F1] flex flex-wrap gap-2 items-center">
            <Button onClick={downloadPDF} variant="outline" size="sm" data-testid="download-pdf-btn">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button onClick={sendEmail} disabled={actionLoading} variant="outline" size="sm" data-testid="send-email-btn">
              <Mail className="w-4 h-4" /> Envoyer par email
            </Button>
            <Button onClick={() => setShowEdit(true)} variant="outline" size="sm" data-testid="edit-devis-btn">
              <Edit className="w-4 h-4" /> Modifier
            </Button>
            {devis.statut === "en_attente" && (
              <Button onClick={convertToFacture} disabled={actionLoading} size="sm" data-testid="convert-facture-btn">
                <CheckCircle className="w-4 h-4" /> Accepter et facturer
              </Button>
            )}
            <Select value={devis.statut} onValueChange={updateStatut}>
              <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="statut-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button onClick={deleteDevis} variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F6FB]">
              <tr>
                <th className="text-left px-4 py-3 t-label">Description</th>
                <th className="text-right px-4 py-3 t-label">Qté</th>
                <th className="text-right px-4 py-3 t-label">Prix unit.</th>
                <th className="text-right px-4 py-3 t-label">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {devis.items.map((item, i) => (
                <tr key={i} className={["border-t border-[#E4E8F1]", i % 2 === 1 ? "bg-background/40" : ""].join(" ")}>
                  <td className="px-4 py-3 text-sm text-[#0F1222]">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#4A4F6B] font-mono">{item.quantite}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#4A4F6B] font-mono">{fmt(item.prix_unitaire)}</td>
                  <td className="px-4 py-3 text-sm text-right font-display font-semibold text-[#0F1222]">{fmt(item.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm">
          <div className="max-w-sm ml-auto space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Montant HT</span>
              <span className="font-display font-semibold text-[#0F1222]">{fmt(devis.montant_ht)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">TVA ({devis.tva_pourcent}%)</span>
              <span className="font-display font-semibold text-[#0F1222]">{fmt(devis.montant_tva)}</span>
            </div>
            <div className="flex justify-between text-lg border-t border-[#E4E8F1] pt-3">
              <span className="font-display font-semibold text-[#0F1222]">Total TTC</span>
              <span className="font-display font-semibold text-[#4F46E5]">{fmt(devis.montant_ttc)}</span>
            </div>
          </div>
        </div>

        {devis.notes && (
          <div className="bg-white border border-[#E4E8F1] rounded-2xl p-6 shadow-sm">            <p className="text-sm text-[#4A4F6B] whitespace-pre-wrap leading-relaxed">{devis.notes}</p>
          </div>
        )}
      </div>

      {showEdit && (
        <DevisFormModal
          devisId={devisId}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            loadDevis();
            toast.success("Devis mis à jour");
          }}
        />
      )}
    </AppShell>
  );
}