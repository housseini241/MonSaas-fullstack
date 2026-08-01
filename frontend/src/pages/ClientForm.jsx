import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function ClientForm() {
  const { clientId } = useParams();
  const isEdit = !!clientId;
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    adresse: "", ville: "", code_postal: "", notes: "",
  });

  useEffect(() => {
    if (isEdit) loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const r = await api.get(`/artisan/clients/${clientId}`);
      setFormData({
        nom: r.data.nom || "", prenom: r.data.prenom || "",
        email: r.data.email || "", telephone: r.data.telephone || "",
        adresse: r.data.adresse || "", ville: r.data.ville || "",
        code_postal: r.data.code_postal || "", notes: r.data.notes || "",
      });
    } catch (e) {
      toast.error("Client introuvable");
      nav("/clients");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([_, v]) => v && v.trim())
    );
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/artisan/clients/${clientId}`, payload);
        toast.success("Client modifié");
      } else {
        await api.post("/artisan/clients", payload);
        toast.success("Client ajouté");
      }
      nav("/clients");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title={isEdit
        ? <>Modifier le <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">client</span></>
        : <>Nouveau <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">client</span></>}
      actions={
        <Button variant="outline" size="sm" onClick={() => nav("/clients")} data-testid="back-button">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="bg-white border border-[#E4E8F1] rounded-xl p-6 md:p-8 shadow-sm space-y-5 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="t-label">Nom *</Label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              className="mt-2"
              data-testid="client-nom"
            />
          </div>
          <div>
            <Label className="t-label">Prénom</Label>
            <Input
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="mt-2"
              data-testid="client-prenom"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="t-label">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2"
              data-testid="client-email"
            />
          </div>
          <div>
            <Label className="t-label">Téléphone</Label>
            <Input
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="mt-2"
              data-testid="client-telephone"
            />
          </div>
        </div>

        <div>
          <Label className="t-label">Adresse</Label>
          <Input
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            className="mt-2"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="t-label">Code postal</Label>
            <Input
              value={formData.code_postal}
              onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="t-label">Ville</Label>
            <Input
              value={formData.ville}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label className="t-label">Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="mt-2 rounded-2xl"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#E4E8F1]">
          <Button type="button" variant="outline" onClick={() => nav("/clients")}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} data-testid="submit-client-btn">
            <Save className="w-4 h-4" /> {loading ? "Enregistrement..." : (isEdit ? "Modifier" : "Créer le client")}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}