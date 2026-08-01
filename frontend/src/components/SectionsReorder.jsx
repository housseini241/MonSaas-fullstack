import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const SECTION_LABELS = {
  hero: { label: "Hero (titre principal)", desc: "Bandeau d'accueil avec titre, sous-titre et CTA" },
  services: { label: "Services", desc: "Liste de prestations avec photos, adaptée au nombre d'activités" },
  realisations: { label: "Réalisations", desc: "Aperçu de chantiers + lien vers la page complète (masqué si aucune réalisation)" },
  transformation: { label: "Transformation", desc: "Slider avant/après + lien vers la page complète (masqué si aucune transformation)" },
  value_props: { label: "Avantages", desc: "Bandeau « Devis gratuit / Garantie / etc. »" },
  about: { label: "À propos", desc: "Section présentation sur fond sombre" },
  process: { label: "Déroulé", desc: "3 étapes : contact, devis, intervention" },
  contact: { label: "Contact", desc: "Formulaire + coordonnées + carte" },
};

export const DEFAULT_SECTION_ORDER = ["hero", "services", "realisations", "transformation", "value_props", "about", "process", "contact"];

function SortableItem({ id, index }) {
  const meta = SECTION_LABELS[id] || { label: id, desc: "" };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`sortable-${id}`}
      className="bg-white border border-border px-4 py-3 flex items-center gap-3 cursor-default"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Déplacer ${meta.label}`}
        data-testid={`drag-handle-${id}`}
        className="text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground w-6">{String(index + 1).padStart(2, "0")}</div>
      <div className="flex-1">
        <div className="font-display font-semibold text-sm tracking-tight">{meta.label}</div>
        {meta.desc && <div className="text-xs text-muted-foreground mt-0.5">{meta.desc}</div>}
      </div>
    </div>
  );
}

export default function SectionsReorder({ value, onChange }) {
  const order = (value && value.length ? value : DEFAULT_SECTION_ORDER).filter((s) => SECTION_LABELS[s]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(order, oldIndex, newIndex));
  };

  const reset = () => onChange(DEFAULT_SECTION_ORDER);

  return (
    <div data-testid="sections-reorder">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((id, i) => <SortableItem key={id} id={id} index={i} />)}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={reset}
        data-testid="sections-reset"
        className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary underline underline-offset-4"
      >
        Réinitialiser l'ordre par défaut
      </button>
    </div>
  );
}