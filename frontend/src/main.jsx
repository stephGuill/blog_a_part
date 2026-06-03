// Importation de React — nécessaire pour l'utilisation du JSX et des hooks dans l'arbre de composants
import React from "react";
// Importation de ReactDOM — fournit la méthode createRoot pour monter l'application dans le DOM
import ReactDOM from "react-dom/client";
// BrowserRouter : utilise l'API History du navigateur pour gérer la navigation (URL propres sans #)
import { BrowserRouter } from "react-router-dom";

// Composant racine de l'application qui contient la définition de toutes les routes
import App from "./App";
// AuthProvider : fournit le contexte d'authentification (utilisateur connecté, token JWT) à toute l'arborescence
import { AuthProvider } from "@context/AuthContext";
// ThemeProvider : fournit le contexte de thème (clair/sombre, couleurs personnalisées du blog) à toute l'arborescence
import { ThemeProvider } from "@context/ThemeContext";
// ToastProvider : fournit le système de notifications toast (messages flash éphémères) à toute l'arborescence
import { ToastProvider } from "@context/ToastContext";
// Initialisation du système i18next (internationalisation / traductions) — exécuté au chargement du module
import "./i18n/index.js";
// Feuille de style principale qui regroupe les imports de polices Google, Tailwind CSS et les modules CSS
import "./styles/style.css";
// Feuille de style complémentaire avec les styles de base de l'application (body, code, animations logo)
import "./App.css";

// createRoot : crée un arbre React dans le nœud DOM portant l'id "root" (défini dans public/index.html)
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode : active des avertissements supplémentaires en développement (double-render, détection de bugs)
  <React.StrictMode>
    {/* BrowserRouter : enveloppe toute l'application pour activer le système de routage basé sur l'URL */}
    <BrowserRouter>
      {/* AuthProvider : injecte les données d'authentification (user, token, login/logout) dans tout l'arbre */}
      <AuthProvider>
        {/* ThemeProvider : injecte le thème actif (couleurs, mode clair/sombre) dans tout l'arbre */}
        <ThemeProvider>
          {/* ToastProvider : injecte la fonction d'affichage des notifications toast dans tout l'arbre */}
          <ToastProvider>
            {/* App : composant principal contenant la définition de toutes les routes de l'application */}
            <App />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
