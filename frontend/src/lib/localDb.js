// frontend/src/lib/localDb.js
// Base locale SQLite pour le mode offline (Phase 1 — lecture seule).
// Utilise @capacitor-community/sqlite. Sur web (dev navigateur), il faut
// charger jeep-sqlite et initialiser le web store avant toute requête,
// sinon les appels échouent silencieusement.

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";

const isWeb = Capacitor.getPlatform() === "web";

const DB_NAME = "hustart_local";

// --- Schéma des 3 tables (champ synced_at = horodatage ISO 8601 de la sync) ---
const TABLES = {
  clients: `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    ville TEXT,
    code_postal TEXT,
    statut_pipeline TEXT,
    synced_at TEXT
  );`,
  devis: `CREATE TABLE IF NOT EXISTS devis (
    id TEXT PRIMARY KEY,
    numero TEXT,
    client_id TEXT,
    client_nom TEXT,
    date TEXT,
    montant_ht REAL,
    montant_tva REAL,
    montant_ttc REAL,
    tva_pourcent REAL,
    statut TEXT,
    items_json TEXT,
    notes TEXT,
    synced_at TEXT
  );`,
  rdv: `CREATE TABLE IF NOT EXISTS rdv (
    id TEXT PRIMARY KEY,
    titre TEXT,
    date TEXT,
    heure TEXT,
    duree_minutes INTEGER,
    type_rdv TEXT,
    statut TEXT,
    client_id TEXT,
    client_nom TEXT,
    lieu TEXT,
    synced_at TEXT
  );`,
};

let sqliteConnection = null;
let db = null;

// --- Initialisation du plugin web (uniquement en mode navigateur) ---
// Sans cela, les appels SQLite échouent silencieusement sur web.
async function initWebSqlite() {
  if (!isWeb) return;

  // Charger le loader jeep-sqlite et définir le custom element
  const { defineCustomElements } = await import("jeep-sqlite/loader");
  await defineCustomElements(window);

  // Créer l'élément <jeep-sqlite> s'il n'existe pas encore
  let jeepEl = document.querySelector("jeep-sqlite");
  if (!jeepEl) {
    jeepEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepEl);
  }

  // Attendre que le custom element soit défini dans le DOM.
  // initWebStore() n'est PAS une méthode de cet élément : c'est une méthode
  // de SQLiteConnection, appelée séparément dans initLocalDb().
  await customElements.whenDefined("jeep-sqlite");
}

// --- Initialiser la connexion SQLite (idempotent) ---
export async function initLocalDb() {
  if (db) return db;

  await initWebSqlite();

  sqliteConnection = new SQLiteConnection(CapacitorSQLite);

  // Sur web, il faut initialiser le web store AVANT toute connexion,
  // via la méthode initWebStore() de SQLiteConnection (pas de l'élément DOM).
  if (isWeb) {
    await sqliteConnection.initWebStore();
  }

  const result = await sqliteConnection.createConnection(
    DB_NAME,
    false,
    "no-encryption",
    1,
    false
  );
  await result.open();

  const consistency = await sqliteConnection.checkConnectionsConsistency();
  if (consistency.result) {
    const isValid = await sqliteConnection.isConnection(DB_NAME, false);
    if (!isValid.result) {
      throw new Error("Connexion SQLite invalide");
    }
  }

  db = result;

  for (const sql of Object.values(TABLES)) {
    await db.execute(sql);
  }

  return db;
}

// --- Obtenir les colonnes réellement définies d'une table SQLite ---
// Le backend peut renvoyer PLUS de champs que le schéma local n'en stocke
// (ex: notes, user_id, created_at, updated_at, source... sur la table clients).
// On lit donc les colonnes réelles (PRAGMA table_info) pour ne garder que
// celles qui existent dans la table avant INSERT OR REPLACE ; sinon SQLite
// lève "table X has no column named Y" et le cache reste vide (bug critique).
async function getTableColumns(table) {
  const db = await initLocalDb();
  const res = await db.query(`PRAGMA table_info(${table})`);
  return (res.values || []).map((col) => col.name);
}

// --- Upsert générique (INSERT OR REPLACE) pour une table donnée ---
export async function upsertRows(table, rows) {
  if (!rows || !rows.length) return;
  const db = await initLocalDb();

  // Récupérer les colonnes réelles de la table (définies dans localDb.js)
  const tableColumns = await getTableColumns(table);
  if (!tableColumns.length) return;

  // Filtrer : ne garder que les colonnes présentes à la fois dans le schéma
  // ET dans la première ligne. Cela protège contre les champs supplémentaires
  // renvoyés par le backend qui n'existent pas dans le cache local.
  const cols = tableColumns.filter((c) =>
    Object.prototype.hasOwnProperty.call(rows[0], c)
  );
  if (!cols.length) return;

  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  for (const row of rows) {
    await db.run(sql, cols.map((c) => (row[c] === undefined ? null : row[c])));
  }
}

// --- Lire toutes les lignes d'une table ---
export async function getRows(table) {
  const db = await initLocalDb();
  const res = await db.query(`SELECT * FROM ${table}`);
  return res.values || [];
}

// --- Lire une ligne par id ---
export async function getRowById(table, id) {
  const db = await initLocalDb();
  const res = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return (res.values || [])[0] || null;
}

// --- Vider toutes les tables (appelé au logout) ---
export async function clearLocalCache() {
  const db = await initLocalDb();
  for (const table of Object.keys(TABLES)) {
    await db.execute(`DELETE FROM ${table}`);
  }
}
