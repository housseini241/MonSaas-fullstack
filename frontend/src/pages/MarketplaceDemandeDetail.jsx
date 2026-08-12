import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, MapPin, Hammer, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const URGENCE_LABELS = {
  normal: "Normal",
  urgent: "Urgent",
  tres_urgent: "Très urgent",
};

function relativeDate(iso) {
  if (!iso) return "";
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "aujourd'hui";
    if (days === 1) return "hier";
    if (days < 7) return `il y a ${days} jours`;
    return `il y a ${Math.floor(days / 7)} semaine(s)`;
  } catch {
    return "";
  }
}

export default function MarketplaceDemandeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [demande, setDemande] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/public/marketplace/demandes/${id}`)
      .then((res) => setDemande(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCta = () => {
    const repondrePath = `/appels-doffres/${id}/repondre`;
    if (user) {
      nav(repondrePath);
    } else {
      nav(`/login?next=${encodeURIComponent(repondrePath)}`);
    }
  };

  const signupPath = `/signup?next=${encodeURIComponent(`/appels-doffres/${id}/repondre`)}&demande_id=${id}&intent=devis`;

  return (
    <div className="min-h-screen bg-[#F4F6FB]" data-testid="demande-detail-page">
      {/* Header */}
      <header className="border-b border-[#E4E8F1] bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/marketplace" className="flex items-center gap-2">
            <img src="/logo.png" alt="Hustart" className="w-7 h-7 object-contain" />
            <span className="font-display font-semibold text-sm tracking-tight text-[#0F1222]">HuStart</span>
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">
            // appel d'offres
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-[#4A4F6B] hover:text-[#0F1222] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la marketplace
        </Link>

        {loading ? (
          <div className="bg-white border border-[#E4E8F1] rounded-2xl p-10 text-center text-[#6B7280]">
            Chargement…
          </div>
        ) : notFound || !demande ? (
          <div className="bg-white border border-[#E4E8F1] rounded-2xl p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-3">
              // introuvable
            </div>
            <h1 className="font-display font-semibold text-2xl tracking-tight text-[#0F1222] mb-3">
              Cette demande n'est plus disponible
            </h1>
            <p className="text-[#6B7280] text-sm mb-8">
              Elle a peut-être déjà été pourvue ou archivée.
            </p>
            <Link
              to="/marketplace"
              className="inline-block bg-[#0F1222] text-white px-6 py-3 rounded-xl font-semibold text-sm"
            >
              Voir les autres appels d'offres
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E4E8F1] rounded-2xl overflow-hidden">
            {/* Body */}
            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {demande.urgence === "tres_urgent" ? (
                  <span className="inline-flex items-center rounded-sm bg-[#C0392B] text-white px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-[0.14em]">
                    Très urgent
                  </span>
                ) : demande.urgence === "urgent" ? (
                  <span className="inline-flex items-center rounded-sm bg-[#B85C00] text-white px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-[0.14em]">
                    Urgent
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-sm bg-[#EEF1F8] text-[#4A4F6B] px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-[0.14em]">
                    {URGENCE_LABELS[demande.urgence] || "Normal"}
                  </span>
                )}
                {demande.type_travaux && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-[#EEF0FE] text-[#4F46E5] px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-[0.14em]">
                    <Hammer className="w-3 h-3" /> {demande.type_travaux}
                  </span>
                )}
              </div>

              <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-[#0F1222] mb-3">
                Un client cherche un artisan à {demande.city}
              </h1>
              <p className="text-[#6B7280] text-sm mb-8">
                Publié {relativeDate(demande.created_at)}
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border border-[#E4E8F1] rounded-xl">
                  <MapPin className="w-4 h-4 text-[#4F46E5] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B7280] mb-1">
                      Localisation
                    </div>
                    <div className="text-sm font-medium text-[#0F1222]">{demande.city}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-[#E4E8F1] rounded-xl">
                  <Clock className="w-4 h-4 text-[#4F46E5] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B7280] mb-1">
                      Urgence
                    </div>
                    <div className="text-sm font-medium text-[#0F1222]">
                      {URGENCE_LABELS[demande.urgence] || "Normal"}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-[#E4E8F1] rounded-xl">
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B7280] mb-2">
                    Le besoin
                  </div>
                  <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                    {demande.public_teaser}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-[#E4E8F1] p-8 md:p-10 bg-[#FAFBFF]">
              <button
                onClick={handleCta}
                data-testid="demande-detail-cta"
                className="w-full h-13 rounded-xl bg-[#0F1222] hover:bg-[#4F46E5] transition-colors text-white font-semibold text-sm inline-flex items-center justify-center gap-2 py-4"
              >
                Faire un devis <ArrowRight className="w-4 h-4" />
              </button>
              {!user && (
                <p className="text-center text-sm text-[#6B7280] mt-4">
                  Pas encore de compte ?{" "}
                  <Link
                    to={signupPath}
                    className="font-semibold underline underline-offset-4 decoration-2"
                    style={{ color: "#4F46E5" }}
                  >
                    Créez-en un
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
