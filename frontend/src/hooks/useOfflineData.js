// frontend/src/hooks/useOfflineData.js
// Hook de lecture avec fallback offline (Phase 1 — lecture seule).
//
// EXEMPLE D'UTILISATION (à intégrer plus tard dans une page, sans la modifier maintenant) :
//   const { data: clients, isFromCache, loading, error } = useOfflineData("clients");
//   // data = liste de clients (réseau OU cache), isFromCache = true si venant de SQLite
//
//   // Pour un élément unique (détail client / devis) :
//   const { data: client, isFromCache, loading, error } = useOfflineData("clients", { id });

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getRows, getRowById, initLocalDb } from "@/lib/localDb";
import { isOnline } from "@/lib/syncService";

const RESOURCE_TABLE = {
  clients: "clients",
  devis: "devis",
  rdv: "rdv",
};

// Filtrage local de la recherche (miroir du comportement backend $regex "i").
// Utilisé uniquement pour la ressource "clients" (nom/prenom/email/telephone).
function filterRowsBySearch(rows, search) {
  if (!search) return rows;
  const term = String(search).toLowerCase();
  return rows.filter((row) => {
    const fields = [row.nom, row.prenom, row.email, row.telephone];
    return fields.some((val) => String(val ?? "").toLowerCase().includes(term));
  });
}

export default function useOfflineData(resource, options = {}) {
  const { id, params } = options; // id → lire une seule ligne ; params → paramètres de requête (ex: search)
  const table = RESOURCE_TABLE[resource];

  // params est un objet recréé à chaque render → on le stringifie pour avoir
  // une dépendance stable dans useEffect (sinon boucle infinie).
  const paramsKey = JSON.stringify(params ?? {});

  const [data, setData] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFromCache() {
      try {
        await initLocalDb();
        if (cancelled) return;

        if (id) {
          const row = await getRowById(table, id);
          if (cancelled) return;
          if (table === "devis" && row?.items_json) {
            row.items = JSON.parse(row.items_json);
            delete row.items_json;
          }
          setData(row || null);
        } else {
          let rows = await getRows(table);
          if (cancelled) return;
          // Rehydrater les devis (items_json → items)
          if (table === "devis") {
            rows.forEach((r) => {
              if (r.items_json) r.items = JSON.parse(r.items_json);
              delete r.items_json;
            });
          }
          // Recherche hors-ligne : uniquement pour les clients
          // (nom/prenom/email/telephone, insensible à la casse).
          if (table === "clients" && params?.search) {
            rows = filterRowsBySearch(rows, params.search);
          }
          setData(rows);
        }
        setIsFromCache(true);
      } catch (cacheErr) {
        if (cancelled) return;
        setError("Données indisponibles hors-ligne");
        setData(null);
        setIsFromCache(false);
      }
    }

    async function load() {
      setLoading(true);
      setError(null);

      // 1) Si on sait qu'on est hors-ligne → lire directement le cache
      let online = false;
      try {
        online = await isOnline();
      } catch (e) {
        online = false;
      }

      if (!online) {
        await loadFromCache();
        return;
      }

      // 2) Tenter l'appel API normal
      try {
        const url = id ? `/artisan/${resource}/${id}` : `/artisan/${resource}`;
        const res = await api.get(url, { params });
        if (cancelled) return;
        setData(res.data);
        setIsFromCache(false);
      } catch (err) {
        // Distinction stricte :
        // - Si err.response existe (401, 404, 500...) → vraie erreur API, PAS de fallback cache.
        // - Si err.response est ABSENT (Network Error) → problème réseau → fallback cache.
        if (err?.response) {
          if (cancelled) return;
          setError(err?.response?.data?.detail || "Erreur API");
          setData(null);
          setIsFromCache(false);
        } else {
          await loadFromCache();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [resource, id, table, paramsKey]);

  return { data, isFromCache, loading, error };
}
