// Script de vérification runtime via navigateur headless
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  page.on("console", (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

    // Intercepter /auth/me pour simuler une authentification réussie
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("/auth/me")) {
      if (req.method() === "OPTIONS") {
        req.respond({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
          },
        });
      } else {
        req.respond({
          status: 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            id: "fake-user-id",
            email: "test@hustart.fr",
            nom: "Test",
          }),
        });
      }
    } else {
      req.continue();
    }
  });

  // Charger la page pour établir un contexte localStorage
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 30000 });

  // Injecter un faux token pour simuler un utilisateur connecté
  await page.evaluate(() => {
    localStorage.setItem("aw_token", "fake-token-for-testing");
  });

  // Recharger pour que l'app détecte le token et déclenche initSync()
  await page.reload({ waitUntil: "networkidle0" });

  // Laisser le temps à initWebSqlite() de s'exécuter
  await new Promise((r) => setTimeout(r, 2000));

  const hasJeepSqlite = await page.evaluate(() =>
    !!document.querySelector("jeep-sqlite")
  );

  console.log("=== Console logs ===");
  logs.forEach((l) => console.log(l));

  console.log("\n=== Erreurs JS ===");
  if (errors.length === 0) console.log("Aucune erreur");
  errors.forEach((e) => console.log(e));

  console.log("\n=== Élément <jeep-sqlite> présent dans le DOM ===");
  console.log(hasJeepSqlite);

  await browser.close();
})();