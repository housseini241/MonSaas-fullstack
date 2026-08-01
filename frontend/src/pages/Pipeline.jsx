import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Phone, Mail, ArrowRight, Sparkles, MessageSquare,
  PhoneCall, Clock, CheckCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";

const STAGES = [
  { key: "nouveau",    label: "Nouveau",       short: "Nouveau",       icon: Sparkles,    tone: "bg-info/10 text-info border-info/20" },
  { key: "appeler",    label: "Appeler / SMS", short: "Appeler / SMS", icon: PhoneCall,   tone: "bg-primary-light text-primary border-primary/20" },
  { key: "a_rappeler", label: "À rappeler",    short: "À rappeler",    icon: Clock,       tone: "bg-warning/10 text-warning border-warning/30" },
  { key: "signe",      label: "Client signé",  short: "Client signé",  icon: CheckCircle, tone: "bg-success/10 text-success border-success/20" },
];

function ClientCard({ client, onMove, onClick, currentStageIdx }) {
  const phone = client.telephone;
  const email = client.email;
  const fullName = `${client.prenom || ""} ${client.nom}`.trim();
  const hasNext = currentStageIdx < STAGES.length - 1;
  const nextStage = hasNext ? STAGES[currentStageIdx + 1] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-surface border border-border rounded-lg p-3 hover:border-ink-1/20 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`pipeline-card-${client.id}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 bg-ink-1 text-surface flex items-center justify-center rounded-md shrink-0 font-display font-semibold text-sm">
          {(client.prenom?.[0] || client.nom?.[0] || "?").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-sm truncate text-ink-1">{fullName}</div>
          {client.ville && (
            <div className="t-label !text-[9px] truncate">{client.ville}</div>
          )}
        </div>
      </div>

      {(phone || email) && (
        <div className="space-y-1 mb-3">
          {phone && (
            <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-ink-3 hover:text-primary">
              <Phone className="w-3 h-3" /> {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-ink-3 hover:text-primary truncate">
              <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-border">
        {phone && (
          <a
            href={`sms:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-sm border border-border hover:bg-surface-2 font-mono uppercase tracking-[0.14em] text-ink-2"
            title="SMS"
          >
            <MessageSquare className="w-3 h-3" /> SMS
          </a>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(nextStage.key); }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-sm bg-ink-1 text-surface hover:bg-primary font-mono uppercase tracking-[0.14em] transition-colors"
            title={`Passer à : ${nextStage.label}`}
            data-testid={`move-next-${client.id}`}
          >
            <ArrowRight className="w-3 h-3" /> Suivant
          </button>
        )}
      </div>
    </div>
  );
}

function StageColumn({ stage, clients, onMove, onCardClick, stageIdx }) {
  const Icon = stage.icon;
  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl min-h-[400px] shadow-sm overflow-hidden" data-testid={`column-${stage.key}`}>
      <div className={`p-3 border-b ${stage.tone}`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <h3 className="font-display font-semibold text-sm tracking-tight">{stage.short}</h3>
          <span className="ml-auto font-mono text-xs font-medium">{clients.length}</span>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {clients.length === 0 ? (
          <div className="text-center text-xs text-ink-3 py-8 font-mono uppercase tracking-[0.14em]">— Aucun —</div>
        ) : (
          clients.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              currentStageIdx={stageIdx}
              onMove={(newStatus) => onMove(c, newStatus)}
              onClick={() => onCardClick(c)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const nav = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    setLoading(true);
    try {
      const r = await api.get("/artisan/clients");
      setClients(r.data);
    } catch (e) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const moveClient = async (client, newStatus) => {
    try {
      await api.put(`/artisan/clients/${client.id}/pipeline-status`, { statut_pipeline: newStatus });
      const stage = STAGES.find((s) => s.key === newStatus);
      toast.success(`Déplacé vers : ${stage?.label}`);
      loadClients();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const clientsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.key] = clients.filter((c) => (c.statut_pipeline || "nouveau") === stage.key);
    return acc;
  }, {});

  return (
    <AppShell
      title={<>Pipeline <span className="font-light italic text-primary">prospects</span>.</>}
      actions={
        <Button onClick={() => nav("/clients/nouveau")} data-testid="add-prospect-btn" className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> Nouveau prospect
        </Button>
      }
    >
      <div data-testid="pipeline-page">
        {loading ? (
          <div className="py-20 flex items-center justify-center text-ink-3 font-mono text-sm">
            <span className="cursor-blink">Chargement</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAGES.map((stage, idx) => (
              <StageColumn
                key={stage.key}
                stage={stage}
                stageIdx={idx}
                clients={clientsByStage[stage.key]}
                onMove={moveClient}
                onCardClick={(c) => nav(`/clients/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
