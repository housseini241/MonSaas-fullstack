import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { resolveImg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Globe, Plus, Save, Trash2, X, Image as ImageIcon, Loader2, PackageCheck, Truck, ShoppingBag, Settings, ListOrdered } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fmtPrice } from "@/lib/shopCart";

const STATUS_LABELS = {
  pending: "En attente",
  paid: "Payée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function ProductForm({ shopId, product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price_euros: product ? (product.price_cents / 100).toFixed(2) : "",
    compare_euros: product?.compare_at_cents ? (product.compare_at_cents / 100).toFixed(2) : "",
    stock: product?.stock ?? 0,
    category: product?.category || "",
    images: product?.images || [],
    variants: product?.variants || [],
    active: product?.active ?? true,
  });
  const [uploading, setUploading] = useState(false);

  const addVariantGroup = () => setForm({ ...form, variants: [...form.variants, { name: "Taille", options: ["S", "M", "L"] }] });
  const removeVariantGroup = (i) => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });
  const updateGroup = (i, patch) => {
    const v = [...form.variants];
    v[i] = { ...v[i], ...patch };
    setForm({ ...form, variants: v });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "product");
      const r = await api.post(`/shops/${shopId}/upload-image`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, images: [...f.images, r.data.url] }));
    } catch (e) {
      toast.error("Upload échoué");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    const price_cents = Math.round(parseFloat(form.price_euros || "0") * 100);
    if (!form.name || !price_cents) { toast.error("Nom et prix requis"); return; }
    const payload = {
      name: form.name,
      description: form.description,
      price_cents,
      compare_at_cents: form.compare_euros ? Math.round(parseFloat(form.compare_euros) * 100) : null,
      stock: parseInt(form.stock || "0", 10),
      category: form.category,
      images: form.images,
      variants: form.variants,
      active: form.active,
    };
    try {
      if (product) await api.put(`/shops/${shopId}/products/${product.id}`, payload);
      else await api.post(`/shops/${shopId}/products`, payload);
      toast.success("Produit enregistré");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="product-form">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="font-display font-semibold text-xl">{product ? "Modifier le produit" : "Nouveau produit"}</div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded" data-testid="product-form-close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Nom *</label>
            <Input data-testid="prod-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-sm border-border" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Description</label>
            <textarea data-testid="prod-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border p-3 font-sans text-sm" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Prix TTC (€) *</label>
              <Input data-testid="prod-price" inputMode="decimal" value={form.price_euros} onChange={(e) => setForm({ ...form, price_euros: e.target.value })} className="rounded-sm border-border" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Prix barré (€)</label>
              <Input data-testid="prod-compare" inputMode="decimal" value={form.compare_euros} onChange={(e) => setForm({ ...form, compare_euros: e.target.value })} className="rounded-sm border-border" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Stock</label>
              <Input data-testid="prod-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-sm border-border" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Catégorie</label>
              <Input data-testid="prod-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-sm border-border" />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-2">Photos</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((src, i) => (
                <div key={i} className="relative w-24 h-24 border border-border overflow-hidden group" data-testid={`prod-image-${i}`}>
                  <img src={resolveImg(src)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <label className="w-24 h-24 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary text-muted-foreground hover:text-primary" data-testid="prod-add-image">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[10px] mt-1">Ajouter</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Variantes</label>
              <Button size="sm" variant="outline" onClick={addVariantGroup} data-testid="prod-add-variant" className="rounded-sm border-border">
                <Plus className="w-3 h-3 mr-1" /> Ajouter un groupe
              </Button>
            </div>
            {form.variants.length === 0 && <p className="text-xs text-muted-foreground">Aucune variante (produit simple).</p>}
            <div className="space-y-3">
              {form.variants.map((g, i) => (
                <div key={i} className="border border-border p-3 grid md:grid-cols-12 gap-2 items-start" data-testid={`variant-group-${i}`}>
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-muted-foreground">Nom du groupe</label>
                    <Input value={g.name} onChange={(e) => updateGroup(i, { name: e.target.value })} className="rounded-sm border-border h-9" />
                  </div>
                  <div className="md:col-span-8">
                    <label className="text-[10px] text-muted-foreground">Options (séparées par des virgules)</label>
                    <Input value={(g.options || []).join(", ")} onChange={(e) => updateGroup(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="rounded-sm border-border h-9" />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeVariantGroup(i)} className="text-red-600 p-2 hover:bg-red-50" data-testid={`remove-variant-${i}`}><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[#F95A2C]" data-testid="prod-active" />
            Produit actif (visible sur la boutique)
          </label>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose} className="rounded-sm border-border">Annuler</Button>
          <Button onClick={save} data-testid="prod-save" className="rounded-sm bg-foreground hover:bg-primary text-white"><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

export default function ShopBuilder() {
  const { shopId } = useParams();
  const nav = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null); // "new" | product object | null
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [s, p, o] = await Promise.all([
        api.get(`/shops/${shopId}`),
        api.get(`/shops/${shopId}/products`),
        api.get(`/shops/${shopId}/orders`),
      ]);
      setShop(s.data);
      setProducts(p.data);
      setOrders(o.data);
    } catch (e) {
      toast.error("Boutique introuvable");
      nav("/dashboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, [shopId]);

  const saveShop = async () => {
    setSaving(true);
    try {
      const { name, description, city, address, contact_email, phone, tax_rate, shipping_rates, slug } = shop;
      await api.put(`/shops/${shopId}`, { name, description, city, address, contact_email, phone, tax_rate, shipping_rates, slug });
      toast.success("Boutique enregistrée");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      await api.post(`/shops/${shopId}/publish`);
      setShop({ ...shop, status: "published" });
      toast.success("Boutique publiée");
    } catch (e) {
      toast.error("Erreur de publication");
    }
  };

  const deleteProduct = async (p) => {
    try {
      await api.delete(`/shops/${shopId}/products/${p.id}`);
      toast.success("Produit supprimé");
      loadAll();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const updateOrderStatus = async (o, status) => {
    try {
      await api.put(`/shops/${shopId}/orders/${o.id}`, { status });
      toast.success("Statut mis à jour");
      loadAll();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  if (loading || !shop) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const publicUrl = `${window.location.origin}/shop/${shop.slug}`;
  const updateField = (k, v) => setShop({ ...shop, [k]: v });

  return (
    <div className="min-h-screen bg-background" data-testid="shop-builder">
      <header className="border-b border-border bg-surface/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-primary transition-colors"
              data-testid="shop-builder-back"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-ink-1 flex items-center justify-center rounded-md shrink-0">
                <span className="text-primary font-display font-semibold text-sm leading-none">S</span>
              </div>
              <span className="font-display font-semibold text-base tracking-tight text-ink-1 truncate">{shop.name}</span>
              <span className={[
                "t-label !text-[9px] px-2 py-0.5 rounded-sm",
                shop.status === "published" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
              ].join(" ")}>
                {shop.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, "_blank")} data-testid="shop-view-public">
              <ExternalLink className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">Voir la boutique</span>
            </Button>
            <Button variant="secondary" onClick={saveShop} disabled={saving} size="sm" data-testid="shop-save">
              <Save className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">Enregistrer</span>
            </Button>
            <Button onClick={publish} size="sm" data-testid="shop-publish">
              <Globe className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">{shop.status === "published" ? "Publié" : "Publier"}</span>
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="products" className="w-full">
        <div className="border-b border-border bg-surface px-4 md:px-8 overflow-x-auto scrollbar-hide">
          <TabsList className="h-12 bg-transparent rounded-none p-0 gap-1 flex flex-nowrap min-w-max">
            <TabsTrigger value="products" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap" data-testid="tab-products"><ShoppingBag className="w-3.5 h-3.5 mr-2" /> Produits <span className="ml-2 bg-surface-2 text-ink-2 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">{products.length}</span></TabsTrigger>
            <TabsTrigger value="orders" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap" data-testid="tab-orders"><ListOrdered className="w-3.5 h-3.5 mr-2" /> Commandes <span className="ml-2 bg-primary text-white px-1.5 py-0.5 rounded-sm font-mono text-[10px]">{orders.length}</span></TabsTrigger>
            <TabsTrigger value="shipping" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap" data-testid="tab-shipping"><Truck className="w-3.5 h-3.5 mr-2" /> Livraison</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-md data-[state=active]:bg-primary-light data-[state=active]:text-primary data-[state=active]:shadow-none text-ink-2 font-medium px-4 whitespace-nowrap" data-testid="tab-shop-settings"><Settings className="w-3.5 h-3.5 mr-2" /> Paramètres</TabsTrigger>
          </TabsList>
        </div>

        {/* PRODUCTS */}
        <TabsContent value="products" className="m-0">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
            <div className="flex items-center justify-between mb-8">
              <div>                <h2 className="font-display text-display-l mt-2 text-ink-1">Vos produits</h2>
              </div>
              <Button onClick={() => setEditing("new")} data-testid="new-product-btn"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
            </div>
            {products.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-sm" data-testid="empty-products">
                <div className="w-14 h-14 mx-auto bg-primary-light text-primary rounded-xl flex items-center justify-center mb-4">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-display-m mb-2">Aucun produit</h3>
                <p className="text-ink-3 text-sm">Commencez par ajouter votre premier produit.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} data-testid={`shop-product-${p.id}`} className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="aspect-square bg-surface-2 border-b border-border overflow-hidden">
                      {(p.images || [])[0] ? (
                        <img src={resolveImg(p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-3"><ImageIcon className="w-8 h-8" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold truncate">{p.name}</h3>
                        {!p.active && <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">inactif</span>}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="font-semibold">{fmtPrice(p.price_cents)}</span>
                        <span className={`text-xs ${p.stock > 0 ? "text-muted-foreground" : "text-[#C84B31]"}`}>{p.stock > 0 ? `${p.stock} en stock` : "Rupture"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setEditing(p)} data-testid={`edit-product-${p.id}`} className="rounded-sm border-border">Modifier</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" data-testid={`delete-product-${p.id}`} className="rounded-sm border-border hover:bg-red-600 hover:text-white"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle><AlertDialogDescription>Cette action est définitive.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteProduct(p)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders" className="m-0">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <h2 className="font-display font-semibold text-3xl tracking-tight mb-6">Commandes</h2>
            {orders.length === 0 ? (
              <div className="bg-white border border-border p-16 text-center" data-testid="empty-orders">
                <ListOrdered className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucune commande pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} data-testid={`order-${o.id}`} className="bg-white border border-border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="font-display font-semibold">#{o.id.slice(0, 8)} · {o.customer_name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleString("fr-FR")} · {o.customer_email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{fmtPrice(o.total_cents, o.currency)}</span>
                        <select value={o.status} onChange={(e) => updateOrderStatus(o, e.target.value)} data-testid={`order-status-${o.id}`} className="border border-border px-2 py-1 text-xs font-mono uppercase">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <ul className="text-sm border-t border-border/60 pt-2">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between py-1">
                          <span>{it.qty}× {it.name} {it.variant && Object.keys(it.variant).length ? `(${Object.entries(it.variant).map(([k, v]) => `${k}: ${v}`).join(", ")})` : ""}</span>
                          <span className="text-muted-foreground">{fmtPrice(it.line_total_cents, o.currency)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-muted-foreground">Livraison : <b>{o.shipping_method_name}</b> {o.shipping_address ? `— ${o.shipping_address}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping" className="m-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
            <h2 className="font-display font-semibold text-3xl tracking-tight mb-2">Tarifs de livraison</h2>
            <p className="text-sm text-muted-foreground mb-6">Ajoutez ou modifiez les options proposées à vos clients au moment du paiement.</p>
            <div className="space-y-3" data-testid="shipping-rates">
              {(shop.shipping_rates || []).map((r, i) => (
                <div key={r.id || i} className="bg-white border border-border p-4 grid grid-cols-12 gap-3 items-center" data-testid={`shipping-rate-${i}`}>
                  <div className="col-span-6">
                    <label className="text-[10px] text-muted-foreground">Nom</label>
                    <Input value={r.name} onChange={(e) => {
                      const rates = [...shop.shipping_rates];
                      rates[i] = { ...rates[i], name: e.target.value };
                      setShop({ ...shop, shipping_rates: rates });
                    }} className="rounded-sm border-border h-9" />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] text-muted-foreground">Tarif (€)</label>
                    <Input inputMode="decimal" value={(r.amount_cents / 100).toFixed(2)} onChange={(e) => {
                      const rates = [...shop.shipping_rates];
                      rates[i] = { ...rates[i], amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) };
                      setShop({ ...shop, shipping_rates: rates });
                    }} className="rounded-sm border-border h-9" />
                  </div>
                  <div className="col-span-2 flex items-end gap-2">
                    <label className="text-xs flex items-center gap-1">
                      <input type="checkbox" checked={!!r.is_pickup} onChange={(e) => {
                        const rates = [...shop.shipping_rates];
                        rates[i] = { ...rates[i], is_pickup: e.target.checked };
                        setShop({ ...shop, shipping_rates: rates });
                      }} /> Retrait
                    </label>
                    <button type="button" onClick={() => setShop({ ...shop, shipping_rates: shop.shipping_rates.filter((_, idx) => idx !== i) })} data-testid={`remove-rate-${i}`} className="text-red-600 hover:bg-red-50 p-1"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setShop({ ...shop, shipping_rates: [...(shop.shipping_rates || []), { id: `rate_${Date.now()}`, name: "Nouveau tarif", amount_cents: 0, is_pickup: false }] })} data-testid="add-shipping-rate" className="rounded-sm border-border"><Plus className="w-4 h-4 mr-2" /> Ajouter un tarif</Button>
            </div>
          </div>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="m-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-5">
            <h2 className="font-display font-semibold text-3xl tracking-tight">Paramètres</h2>
            <div className="bg-white border border-border p-8 space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Nom de la boutique</label>
                <Input value={shop.name} onChange={(e) => updateField("name", e.target.value)} data-testid="shop-name" className="rounded-sm border-border" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">URL (slug)</label>
                <Input value={shop.slug} onChange={(e) => updateField("slug", e.target.value)} data-testid="shop-slug" className="rounded-sm border-border" />
                <div className="text-xs text-muted-foreground mt-1 font-mono">{window.location.origin}/shop/{shop.slug}</div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Description</label>
                <textarea rows={3} value={shop.description || ""} onChange={(e) => updateField("description", e.target.value)} data-testid="shop-desc" className="w-full border border-border p-3 font-sans text-sm" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Ville</label>
                  <Input value={shop.city || ""} onChange={(e) => updateField("city", e.target.value)} data-testid="shop-city" className="rounded-sm border-border" />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Téléphone</label>
                  <Input value={shop.phone || ""} onChange={(e) => updateField("phone", e.target.value)} data-testid="shop-phone" className="rounded-sm border-border" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Email de contact (notifications commandes)</label>
                <Input value={shop.contact_email || ""} onChange={(e) => updateField("contact_email", e.target.value)} data-testid="shop-email" className="rounded-sm border-border" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Taux de TVA (%)</label>
                <Input type="number" step="0.01" min="0" max="1" value={shop.tax_rate || 0} onChange={(e) => updateField("tax_rate", parseFloat(e.target.value))} data-testid="shop-tax" className="rounded-sm border-border w-32" />
                <div className="text-xs text-muted-foreground mt-1">Entre 0 et 1 (ex : 0.20 pour 20%). TVA incluse dans les prix.</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {editing && (
        <ProductForm
          shopId={shopId}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadAll(); }}
        />
      )}
    </div>
  );
}
