import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import api, { resolveImg } from "@/lib/api";

export default function TransformationsManager({ site, onReplace }) {
  const [title, setTitle] = useState("");
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);

  const submit = async () => {
    if (!title.trim() || !beforeFile || !afterFile) {
      toast.error("Titre et images avant/après requis");
      return;
    }
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("before", beforeFile);
    fd.append("after", afterFile);
    try {
      const r = await api.post(`/sites/${site.id}/transformations`, fd);
      onReplace(r.data);
      toast.success("Avant / après ajouté");
      setTitle("");
      setBeforeFile(null);
      setAfterFile(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'ajout");
    }
  };

  const remove = async (itemId) => {
    try {
      const r = await api.delete(`/sites/${site.id}/transformations/${itemId}`);
      onReplace(r.data);
      toast.success("Avant / après supprimé");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const items = site.transformations || [];

  return (
    <div className="bg-white border border-border p-6" data-testid="design-transformations">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Preuve de travail</div>
      <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Avant / Après</h3>
      <p className="text-sm text-muted-foreground mb-4">Montrez la transformation de vos chantiers avec deux photos.</p>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {items.map((item) => (
            <div key={item.id} className="relative bg-background border border-border overflow-hidden">
              <div className="flex">
                <div className="w-1/2">
                  <img src={resolveImg(item.before_url)} alt={`${item.title} avant`} className="w-full h-28 object-cover" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center py-1 border-t border-border">Avant</div>
                </div>
                <div className="w-1/2">
                  <img src={resolveImg(item.after_url)} alt={`${item.title} après`} className="w-full h-28 object-cover" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary text-center py-1 border-t border-border">Après</div>
                </div>
              </div>
              <div className="px-3 py-2 text-sm font-medium truncate border-t border-border">{item.title}</div>
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 bg-foreground text-white p-1.5 rounded-sm opacity-90 hover:opacity-100"
                data-testid="delete-transformation"
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
        <div className="w-full md:flex-1 min-w-[180px]">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Titre</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Rénovation cuisine" className="h-10 rounded-sm border-border" data-testid="transformation-title" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Avant</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-ink-3 file:mr-3 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-1.5"
            data-testid="transformation-before"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Après</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-ink-3 file:mr-3 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-1.5"
            data-testid="transformation-after"
          />
        </div>
        <Button onClick={submit} className="rounded-sm" data-testid="add-transformation">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>
    </div>
  );
}
