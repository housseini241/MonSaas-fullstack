import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import api, { resolveImg } from "@/lib/api";
import { toast } from "sonner";

const Field = ({ label, children }) => (
  <div>
    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">{label}</label>
    {children}
  </div>
);

const Section = ({ title, code, children }) => (
  <section className="bg-white border border-border p-6 md:p-8" data-testid={`content-section-${code}`}>
    <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
      <h3 className="font-display font-semibold text-xl tracking-tight">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

/**
 * ServicesEditor: photo + nom + description de chaque service.
 * Edite site.content.services via setSite (contrôlé), upload/suppression
 * d'image via les endpoints dédiés /sites/:id/services/:index/image.
 */
export default function ServicesEditor({ site, setSite, siteId }) {
  const services = site.content?.services || [];
  const fileInputs = useRef({});

  const updateArrayItem = (idx, field, value) => {
    const arr = [...services];
    arr[idx] = { ...arr[idx], [field]: value };
    setSite((s) => ({ ...s, content: { ...s.content, services: arr } }));
  };

  const addArrayItem = (template) => {
    setSite((s) => ({
      ...s,
      content: { ...s.content, services: [...(s.content?.services || []), template] },
    }));
  };

  const removeArrayItem = (idx) => {
    const arr = [...services];
    arr.splice(idx, 1);
    setSite((s) => ({ ...s, content: { ...s.content, services: arr } }));
  };

  const uploadServiceImage = async (index, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post(`/sites/${siteId}/services/${index}/image`, fd);
      setSite(r.data);
      toast.success("Photo du service mise à jour");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'upload");
    }
  };

  const deleteServiceImage = async (index) => {
    try {
      const r = await api.delete(`/sites/${siteId}/services/${index}/image`);
      setSite(r.data);
      toast.success("Photo du service supprimée");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const handleServiceImageChange = (index, e) => {
    const file = e.target.files?.[0];
    if (file) uploadServiceImage(index, file);
    e.target.value = "";
  };

  return (
    <Section title="Services" code="services">
      {services.map((s, i) => (
        <div key={i} className="border border-border p-4 relative" data-testid={`edit-service-${i}`}>
          <button onClick={() => removeArrayItem(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-red-600" data-testid={`remove-service-${i}`}>
            <X className="w-4 h-4" />
          </button>

          {/* Photo du service */}
          <div className="mb-4 pr-8">
            <div className="flex items-start gap-4 flex-wrap">
              {s.image_url ? (
                <>
                  <div className="w-full max-w-xs bg-background border border-border overflow-hidden">
                    <img src={resolveImg(s.image_url)} alt={s.name || `Service ${i + 1}`} className="w-full h-36 object-cover" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" className="hidden" id={`service-image-upload-${i}`} ref={(el) => (fileInputs.current[`service-image-upload-${i}`] = el)} onChange={(e) => handleServiceImageChange(i, e)} data-testid={`service-image-input-${i}`} />
                    <Button variant="outline" onClick={() => fileInputs.current[`service-image-upload-${i}`]?.click()} className="rounded-sm" data-testid={`service-image-change-${i}`}>
                      <Plus className="w-4 h-4 mr-2" /> Changer la photo
                    </Button>
                    <Button variant="outline" onClick={() => deleteServiceImage(i)} className="rounded-sm text-destructive" data-testid={`service-image-delete-${i}`}>
                      <X className="w-4 h-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full max-w-xs h-28 bg-background border border-border flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" className="hidden" id={`service-image-upload-${i}`} ref={(el) => (fileInputs.current[`service-image-upload-${i}`] = el)} onChange={(e) => handleServiceImageChange(i, e)} data-testid={`service-image-input-${i}`} />
                    <Button variant="outline" onClick={() => fileInputs.current[`service-image-upload-${i}`]?.click()} className="rounded-sm" data-testid={`service-image-add-${i}`}>
                      <Plus className="w-4 h-4 mr-2" /> Ajouter une photo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Field label={`Service ${i + 1} — Nom`}>
            <Input value={s.name || ""} onChange={(e) => updateArrayItem(i, "name", e.target.value)} className="h-11 rounded-sm border-border" />
          </Field>
          <div className="mt-3">
            <Field label="Description">
              <Textarea rows={3} value={s.description || ""} onChange={(e) => updateArrayItem(i, "description", e.target.value)} className="rounded-sm border-border" />
            </Field>
          </div>
        </div>
      ))}
      <Button onClick={() => addArrayItem({ name: "Nouveau service", description: "Description du service..." })} variant="outline" className="rounded-sm border-border hover:bg-black hover:text-white" data-testid="add-service">
        <Plus className="w-4 h-4 mr-2" /> Ajouter un service
      </Button>
    </Section>
  );
}
