import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";

const TYPES_RDV = [
  { value: "devis_sur_place", label: "Devis sur place" },
  { value: "intervention", label: "Intervention" },
  { value: "sav", label: "SAV" },
  { value: "consultation", label: "Consultation" },
  { value: "autre", label: "Autre" },
];

const TYPE_COLORS = {
  devis_sur_place: "bg-blue-100 text-blue-700 border-blue-300",
  intervention: "bg-orange-100 text-orange-700 border-orange-300",
  sav: "bg-red-100 text-red-700 border-red-300",
  consultation: "bg-purple-100 text-purple-700 border-purple-300",
  autre: "bg-gray-100 text-gray-700 border-gray-300",
};

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad(n) { return String(n).padStart(2, "0"); }

function getMonthDays(year, month) {
  /** Returns array of 42 entries (6 weeks) for the calendar grid */
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 1, Sunday = 0 -> shift to Mon-first (0..6)
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const cells = [];
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthLastDay - i, month: month - 1, year, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, otherMonth: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    let nm = last.month + 1, ny = last.year;
    if (nm > 11) { nm = 0; ny++; }
    cells.push({ day: cells.length - daysInMonth - firstWeekday + 1, month: nm, year: ny, otherMonth: true });
  }
  return cells;
}

function formatDate(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function RDVFormModal({ onClose, onSuccess, initialDate, editingRdv }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: editingRdv?.client_id || "",
    titre: editingRdv?.titre || "",
    description: editingRdv?.description || "",
    date: editingRdv?.date || initialDate || new Date().toISOString().split("T")[0],
    heure: editingRdv?.heure || "09:00",
    duree_minutes: editingRdv?.duree_minutes || 60,
    type_rdv: editingRdv?.type_rdv || "consultation",
    lieu: editingRdv?.lieu || "",
    notes: editingRdv?.notes || "",
  });

  useEffect(() => {
    api.get("/artisan/clients").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setLoading(true);
    try {
      // Strip empty client_id
      const payload = { ...formData };
      if (!payload.client_id) delete payload.client_id;
      if (!payload.lieu) delete payload.lieu;
      if (!payload.description) delete payload.description;
      if (!payload.notes) delete payload.notes;

      if (editingRdv) {
        await api.put(`/artisan/rdv/${editingRdv.id}`, payload);
        toast.success("RDV modifié");
      } else {
        await api.post("/artisan/rdv", payload);
        toast.success("RDV créé");
      }
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRdv) return;
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    try {
      await api.delete(`/artisan/rdv/${editingRdv.id}`);
      toast.success("RDV supprimé");
      onSuccess();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl my-8" data-testid="rdv-form-modal">
        <div className="border-b border-[#E4E8F1] p-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              // {editingRdv ? "modifier" : "nouveau"} rendez-vous
            </div>
            <h2 className="font-display font-semibold text-2xl tracking-tight mt-1">
              {editingRdv ? "Modifier le RDV" : "Nouveau RDV"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Titre *</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Visite de chantier"
              className="rounded-xl"
              data-testid="rdv-titre"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Client (optionnel)</Label>
              <Select value={formData.client_id || "none"} onValueChange={(v) => setFormData({ ...formData, client_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de RDV</Label>
              <Select value={formData.type_rdv} onValueChange={(v) => setFormData({ ...formData, type_rdv: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_RDV.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Heure *</Label>
              <Input
                type="time"
                value={formData.heure}
                onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Durée (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={formData.duree_minutes}
                onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) || 60 })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>Lieu (optionnel)</Label>
            <Input
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              placeholder="Adresse ou lieu du RDV"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E4E8F1]">
            {editingRdv ? (
              <Button type="button" variant="outline" onClick={handleDelete} className="rounded-xl text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl text-white border-0"
                style={{ background: "linear-gradient(120deg, #4F46E5, #22D3EE)" }}
                data-testid="submit-rdv-btn"
              >
                {loading ? "Enregistrement..." : (editingRdv ? "Modifier" : "Créer le RDV")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const TYPE_TONES_V2 = {
  devis_sur_place: "bg-info/10 text-info border-info/20",
  intervention:    "bg-[#EEF0FE] text-[#4F46E5] border-primary/20",
  sav:             "bg-destructive/10 text-destructive border-destructive/20",
  consultation:    "bg-success/10 text-success border-success/20",
  autre:           "bg-[#F4F6FB] text-[#4A4F6B] border-[#E4E8F1]",
};

export default function Agenda() {
  const nav = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [initialDate, setInitialDate] = useState(null);
  const [editingRdv, setEditingRdv] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const cells = getMonthDays(year, month);

  const loadRdvs = async () => {
    setLoading(true);
    try {
      const firstDay = formatDate(year, month, 1);
      const lastDay = formatDate(year, month, new Date(year, month + 1, 0).getDate());
      const r = await api.get("/artisan/rdv", {
        params: { date_debut: firstDay, date_fin: lastDay }
      });
      setRdvs(r.data);
    } catch (e) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRdvs();
  }, [year, month]);

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const rdvsByDate = rdvs.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const handleDayClick = (cell) => {
    const dateStr = formatDate(cell.year, cell.month, cell.day);
    setInitialDate(dateStr);
    setEditingRdv(null);
    setShowForm(true);
  };

  const handleRdvClick = (rdv, e) => {
    e.stopPropagation();
    setEditingRdv(rdv);
    setInitialDate(null);
    setShowForm(true);
  };

  return (
    <AppShell
      title={<>Votre <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">agenda</span>.</>}
      actions={
        <Button
          onClick={() => { setEditingRdv(null); setInitialDate(null); setShowForm(true); }}
          data-testid="create-rdv-btn"
          className="hidden sm:inline-flex"
        >
          <Plus className="w-4 h-4" /> Nouveau RDV
        </Button>
      }
    >
      <div className="space-y-4" data-testid="agenda-page">
        <div className="sm:hidden">
          <Button
            onClick={() => { setEditingRdv(null); setInitialDate(null); setShowForm(true); }}
            className="w-full" size="lg"
          >
            <Plus className="w-4 h-4" /> Nouveau RDV
          </Button>
        </div>

        {/* Calendar */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrev} data-testid="prev-month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday} data-testid="today-btn">
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={goNext} data-testid="next-month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="font-display font-semibold text-2xl tracking-tight text-[#0F1222]">
              {MOIS[month]} <span className="font-light italic text-[#6B7280]">{year}</span>
            </h2>
            <div className="w-[120px] hidden sm:flex justify-end">
              {loading && <span className="t-label">chargement…</span>}
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-t-md overflow-hidden">
            {JOURS_SEMAINE.map((j) => (
              <div key={j} className="bg-[#F4F6FB] p-2 t-label text-center">{j}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-b-md overflow-hidden">
            {cells.map((cell, idx) => {
              const dateStr = formatDate(cell.year, cell.month, cell.day);
              const dayRdvs = rdvsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(cell)}
                  className={`bg-white min-h-[100px] md:min-h-[120px] p-2 cursor-pointer hover:bg-[#EEF0FE]/50 transition-colors ${
                    cell.otherMonth ? "opacity-40" : ""
                  }`}
                  data-testid={`day-${dateStr}`}
                >
                  <div className={`text-xs font-display font-semibold mb-1.5 flex items-center justify-center w-6 h-6 ${
                    isToday ? "bg-primary text-white rounded-full" : "text-[#0F1222]"
                  }`}>
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {dayRdvs.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        onClick={(e) => handleRdvClick(r, e)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate ${TYPE_TONES_V2[r.type_rdv] || TYPE_TONES_V2.autre}`}
                        title={`${r.heure} - ${r.titre}`}
                        data-testid={`rdv-pill-${r.id}`}
                      >
                        <span className="font-semibold">{r.heure}</span> {r.titre}
                      </div>
                    ))}
                    {dayRdvs.length > 3 && (
                      <div className="text-[9px] text-[#6B7280] font-mono">+{dayRdvs.length - 3} autres</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white border border-[#E4E8F1] rounded-2xl p-4 shadow-sm">          <div className="flex flex-wrap gap-2">
            {TYPES_RDV.map((t) => (
              <div key={t.value} className={`text-xs px-2.5 py-1 rounded-md border ${TYPE_TONES_V2[t.value]}`}>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <RDVFormModal
          initialDate={initialDate}
          editingRdv={editingRdv}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); loadRdvs(); }}
        />
      )}
    </AppShell>
  );
}