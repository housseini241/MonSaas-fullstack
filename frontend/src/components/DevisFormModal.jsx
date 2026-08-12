import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function fmt(amount) {
  return new Intl.NumberFormat("fr-FR", { 
    style: "currency", 
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(amount || 0);
}

export default function DevisFormModal({ onClose, onSuccess, devisId = null, presetClientId = null }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: presetClientId || "",
    date: new Date().toISOString().split('T')[0],
    validite_jours: 30,
    tva_pourcent: 20.0,
    items: [{ description: "", quantite: 1, prix_unitaire: 0, montant: 0 }],
    notes: ""
  });

  useEffect(() => {
    loadClients();
    if (devisId) {
      loadDevis();
    }
  }, [devisId]);

  const loadClients = async () => {
    try {
      const r = await api.get("/artisan/clients");
      setClients(r.data);
    } catch (e) {
      toast.error("Erreur lors du chargement des clients");
    }
  };

  const loadDevis = async () => {
    try {
      const r = await api.get(`/artisan/devis/${devisId}`);
      setFormData({
        client_id: r.data.client_id,
        date: r.data.date,
        validite_jours: r.data.validite_jours,
        tva_pourcent: r.data.tva_pourcent,
        items: r.data.items,
        notes: r.data.notes || ""
      });
    } catch (e) {
      toast.error("Erreur lors du chargement du devis");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantite: 1, prix_unitaire: 0, montant: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("Il faut au moins une ligne");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    const numValue = field === 'description' ? value : parseFloat(value) || 0;
    newItems[index][field] = numValue;
    
    // Calculate montant
    if (field === 'quantite' || field === 'prix_unitaire') {
      newItems[index].montant = newItems[index].quantite * newItems[index].prix_unitaire;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const montant_ht = formData.items.reduce((sum, item) => sum + item.montant, 0);
    const montant_tva = montant_ht * (formData.tva_pourcent / 100);
    const montant_ttc = montant_ht + montant_tva;
    return { montant_ht, montant_tva, montant_ttc };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error("Sélectionnez un client");
      return;
    }

    const hasEmptyItems = formData.items.some(item => !item.description.trim());
    if (hasEmptyItems) {
      toast.error("Toutes les lignes doivent avoir une description");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (devisId) {
        result = await api.put(`/artisan/devis/${devisId}`, formData);
      } else {
        result = await api.post("/artisan/devis", formData);
      }
      onSuccess(result.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl my-8" data-testid="devis-form-modal">
        {/* Header */}
        <div className="border-b border-border p-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              // nouveau devis
            </div>
            <h2 className="font-display font-semibold text-2xl tracking-tight mt-1">
              {devisId ? "Modifier le devis" : "Créer un devis"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client & Date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Client *</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(val) => setFormData({ ...formData, client_id: val })}
              >
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.prenom} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="rounded-sm"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Validité (jours)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={formData.validite_jours}
                onChange={(e) => setFormData({ ...formData, validite_jours: parseInt(e.target.value) || 30 })}
                className="rounded-sm"
              />
            </div>
            <div>
              <Label>TVA (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.tva_pourcent}
                onChange={(e) => setFormData({ ...formData, tva_pourcent: parseFloat(e.target.value) || 20 })}
                className="rounded-sm"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Lignes du devis *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="rounded-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter une ligne
              </Button>
            </div>
            <div className="border border-border">
              <div className="hidden md:grid md:grid-cols-12 gap-2 p-3 bg-background border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantité</div>
                <div className="col-span-2">Prix unitaire</div>
                <div className="col-span-2">Montant</div>
                <div className="col-span-1"></div>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid md:grid-cols-12 gap-2 p-3 border-b border-border/60 last:border-b-0">
                  <div className="col-span-12 md:col-span-5">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description du service/produit"
                      className="rounded-sm"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantite}
                      onChange={(e) => updateItem(index, 'quantite', e.target.value)}
                      className="rounded-sm"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.prix_unitaire}
                      onChange={(e) => updateItem(index, 'prix_unitaire', e.target.value)}
                      placeholder="0.00"
                      className="rounded-sm"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 flex items-center">
                    <span className="font-display font-semibold">{fmt(item.montant)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-background border border-border p-4">
            <div className="max-w-md ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-display font-semibold">{fmt(totals.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({formData.tva_pourcent}%)</span>
                <span className="font-display font-semibold">{fmt(totals.montant_tva)}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-border pt-2">
                <span className="font-display font-semibold">Total TTC</span>
                <span className="font-display font-semibold text-primary">{fmt(totals.montant_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes internes ou conditions particulières..."
              rows={3}
              className="rounded-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-sm bg-foreground hover:bg-primary text-white"
              data-testid="submit-devis-btn"
            >
              {loading ? "Enregistrement..." : (devisId ? "Mettre à jour" : "Créer le devis")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
