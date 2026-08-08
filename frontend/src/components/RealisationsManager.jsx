import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Plus, Loader2, Image as ImageIcon } from "lucide-react";
import api, { resolveImg } from "@/lib/api";

export default function RealisationsManager({ site, onReplace }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !file) {
      toast.error("Titre et image requis");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("file", file);
    try {
      const r = await api.post(`/sites/${site.id}/realisations`, fd);
      onReplace(r.data);
      toast.success("Réalisation ajoutée");
      setTitle("");
      setFile(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'ajout");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (itemId) => {
    try {
      const r = await api.delete(`/sites/${site.id}/realisations/${itemId}`);
      onReplace(r.data);
      toast.success("Réalisation supprimée");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const items = site.realisations || [];

  return (
    <div className="bg-white border border-border p-6" data-testid="design-realisations">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Portfolio</div>
      <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Réalisations</h3>
      <p className="text-sm text-muted-foreground mb-4">Présentez vos travaux récents avec une photo et un titre.</p>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {items.map((item) => (
            <div key={item.id} className="relative bg-background border border-border overflow-hidden group">
              <img src={resolveImg(item.image_url)} alt={item.title} className="w-full h-28 object-cover" />
              <div className="p-2 text-sm font-medium truncate">{item.title}</div>
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 bg-foreground text-white p-1.5 rounded-sm opacity-90 hover:opacity-100"
                data-testid="delete-realisation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-24 bg-background border border-border flex items-center justify-center text-muted-foreground mb-5">
          <ImageIcon className="w-8 h-8" />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Titre</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={uploading} placeholder="Ex : Rénovation complète salle de bain" className="h-10 rounded-sm border-border" data-testid="realisation-title" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Photo</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-ink-3 file:mr-3 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="realisation-file"
          />
        </div>
        <Button onClick={submit} disabled={uploading} className="rounded-sm" data-testid="add-realisation">
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )} {uploading ? "Ajout en cours..." : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}
