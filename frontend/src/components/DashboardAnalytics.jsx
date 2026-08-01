import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { AlertTriangle } from "lucide-react";

function fmt(cents, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format((cents || 0) / 100);
}

export default function DashboardAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/analytics/summary").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;

  const orders = data.orders || {};
  const domains = data.domains || {};
  const leads = data.leads || {};
  const expiring = domains.expiring_soon || [];
  const topProducts = orders.top_products || [];

  const isEmpty =
    !data.sites_count && !data.shops_count && !(orders.total_count || 0) && !(domains.active_count || 0) && !(leads.total || 0);
  if (isEmpty) return null;

  // Render only contextual alerts and top products (no KPIs/chart)
  if (expiring.length === 0 && topProducts.length === 0) return null;

  return (
    <section className="mb-12 space-y-4" data-testid="dashboard-analytics">
      {/* Expiring domains alert */}
      {expiring.length > 0 && (
        <div className="bg-primary-light border border-primary/30 rounded-xl p-5" data-testid="expiring-domains-alert">
          <div className="flex items-center gap-2 t-label !text-primary mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> renouvellements à venir
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight mb-3 text-ink-1">
            {expiring.length} domaine{expiring.length > 1 ? "s" : ""} expire{expiring.length > 1 ? "nt" : ""} dans moins de 30 jours
          </h3>
          <div className="space-y-1.5">
            {expiring.slice(0, 5).map((d) => (
              <div key={d.id} data-testid={`expiring-${d.domain_name}`} className="flex items-center justify-between text-sm border-t border-primary/20 pt-1.5">
                <span className="font-medium text-ink-1">{d.domain_name}</span>
                <span className="text-primary">dans {d.days_left} jour{d.days_left > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
          <Link to="/domains" className="inline-block mt-4 text-sm text-primary hover:underline" data-testid="go-renew-domains">
            Renouveler →
          </Link>
        </div>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm" data-testid="top-products">
          <h3 className="font-display font-semibold text-lg tracking-tight text-ink-1 mb-3">Top produits</h3>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.product_id} data-testid={`top-product-${i}`} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate font-medium text-ink-1">{p.name}</span>
                <span className="text-ink-3">× {p.units}</span>
                <span className="font-semibold tabular-nums text-ink-1">{fmt(p.revenue_cents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
