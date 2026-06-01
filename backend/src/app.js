// app.js
// Description (FR): point d'entrée Express minimal pour l'API backend.
// Ce fichier crée l'application Express, ajoute des middlewares globaux,
// configure CORS, montera les routes API et sert les ressources statiques
// (public + build React si présent). Les commentaires ci-dessous expliquent
// chaque import et configuration étape par étape.

// Importer les modules Node natifs utilisés (fs pour vérifier l'existence
// du build React, path pour manipuler les chemins de fichiers).
const fs = require("node:fs");
const path = require("node:path");

// Importer Express et créer une instance d'application.
const express = require("express");
const app = express();

// Middlewares pour parser le JSON et les bodies encodés en URL.
// `express.json()` : parse le corps en JSON et le place dans `req.body`.
// `express.urlencoded()` : supporte les formulaires encodés.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS : on autorise explicitement quelques origines
// de développement et la variable d'environnement FRONTEND_URL.
const cors = require("cors");
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
].filter(Boolean)); // filter(Boolean) enlève les valeurs falsy si FRONTEND_URL est non défini

// Middleware CORS personnalisé : autorise seulement les origines listées.
app.use(
  cors({
    origin(origin, callback) {
      // Si la requête n'a pas d'origine (ex: call serveur-serveur) on autorise
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // Sinon on rejette la requête CORS
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    optionsSuccessStatus: 200, // code de succès pour les requêtes OPTIONS
  })
);

// Importer le routeur central qui regroupe toutes les routes de l'API
const router = require("./router");
// Monter le routeur à la racine de l'application
app.use(router);

// Servir le répertoire public (assets statiques placés dans backend/public)
app.use(express.static(path.join(__dirname, "../public")));

// Tentative de servir une application React si un build est présent
// (chemin relatif au workspace : ../../frontend/dist/index.html)
const reactIndexFile = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');

// Si le fichier index.html du build React existe, servir tout le dossier
// build et rediriger les routes non trouvées vers l'index (SPA fallback).
if (fs.existsSync(reactIndexFile)) {
  // Servir les fichiers statiques du build React
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

  // Rediriger toutes les routes GET non gérées vers l'index React pour
  // permettre au routeur client (React Router) de gérer la navigation.
  app.get('/{*splat}', (req, res) => {
    res.sendFile(reactIndexFile);
  });
}

// Exporter l'application Express pour l'utiliser depuis un serveur (ex: bin/www)
module.exports = app;
 
