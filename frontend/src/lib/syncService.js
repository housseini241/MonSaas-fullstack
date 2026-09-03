// frontend/src/lib/syncService.js
// Service de synchronisation locale (Phase 1 — lecture seule).
// - syncFromServer() : récupère clients/devis/rdv via l'API et fait un
//   upsert (INSERT OR REPLACE) dans SQLite, avec synced_at.
// - isOnline() : wrapper autour de @capacitor/network.
// - clearLocalCacheOnLogout() : vide les tables (appelé au logout).
// - initSync() : sync au démarrage si en ligne + listener réseau.

import { Network } from "@capacitor/network";
import api from "@/lib/api";
import { upsertRows, clearLocalCache } from "@/lib/localDb";

const nowIso = () => new Date().toISOString();

// Flag pour n'enregistrer le listener réseau qu'une seule fois
let _listenerRegistered = false;

// --- Vérifier la connexion réseau ---
export async function isOnline() {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch (e) {
    // Sur web sans plugin natif, fallback : considérer en ligne si navigator.onLine
    return typeof navigator !== "undefined" ? navigator.onLine !== false : true;
  }
}

// --- Upsert d'une liste de lignes avec synced_at ---
async function upsertWithSync(table, rows) {
  if (!rows || !rows.length) return;
  const withSync = rows.map((r) => ({ ...r, synced_at: nowIso() }));
  await upsertRows(table, withSync);
}

// --- Synchroniser tout depuis le serveur ---
export async function syncFromServer() {
  // IMPORTANT : GET /artisan/rdv est appelé SANS date_debut/date_fin,
  // pour cacher TOUS les RDV (pas seulement le mois affiché par Agenda.jsx).
  const [clientsRes, devisRes, rdvRes] = await Promise.all([
    api.get("/artisan/clients"),
    api.get("/artisan/devis"),
    api.get("/artisan/rdv"),
  ]);

  const clients = clientsRes.data || [];
  const devis = devisRes.data || [];
  const rdvs = rdvRes.data || [];

  await upsertWithSync("clients", clients);

  // Pour les devis, on stocke items_json = JSON.stringify(items)
  const devisRows = devis.map((d) => ({
    ...d,
    items_json: JSON.stringify(d.items || []),
  }));
  await upsertWithSync("devis", devisRows);

  await upsertWithSync("rdv", rdvs);

  return { clients: clients.length, devis: devis.length, rdv: rdvs.length };
}

// --- Vider le cache local (appelé au logout) ---
export async function clearLocalCacheOnLogout() {
  await clearLocalCache();
}

// --- Initialiser la sync au démarrage + écouter le retour de connexion ---
export async function initSync() {
  // Sync au démarrage si en ligne ET si un token est présent
  // (évite les appels réseau inutiles quand l'utilisateur est déconnecté)
  const token = localStorage.getItem("aw_token");
  if (token && (await isOnline())) {
    try {
      await syncFromServer();
    } catch (e) {
      // Erreur silencieuse en Phase 1 — on garde le cache existant
      console.warn("[sync] Échec de la sync initiale", e);
    }
  }

  // Relancer la sync au retour de connexion — enregistré UNE seule fois
  if (!_listenerRegistered) {
    _listenerRegistered = true;
    Network.addListener("networkStatusChange", async (status) => {
      if (status.connected) {
        // Ne resync que si un token est présent (utilisateur connecté)
        const t = localStorage.getItem("aw_token");
        if (!t) return;
        try {
          await syncFromServer();
        } catch (e) {
          console.warn("[sync] Échec de la sync au retour réseau", e);
        }
      }
    });
  }
}
