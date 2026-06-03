// Importation des hooks React nécessaires pour le contexte de thème
import { createContext, useEffect, useMemo, useState } from "react";

// Création du contexte de thème avec des valeurs par défaut
// createContext définit la forme des données partagées dans l'arbre de composants
export const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

// Composant fournisseur du thème — enveloppe les composants qui ont besoin du thème
export function ThemeProvider({ children }) {
  // useState avec initialisation lazy : lit le thème depuis localStorage au premier rendu
  // Si aucune préférence sauvegardée, "light" est utilisé comme valeur par défaut
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("blogyoo_theme") || "light"
  );

  // useEffect : s'exécute à chaque changement de `theme`
  // Synchronise le thème avec le DOM et le localStorage
  useEffect(() => {
    // Applique le thème sur l'élément <html> via l'attribut data-theme
    // Les feuilles de style CSS utilisent [data-theme="dark"] pour les variables de couleur
    document.documentElement.dataset.theme = theme;

    // Persiste le choix de thème dans localStorage pour le conserver entre les sessions
    window.localStorage.setItem("blogyoo_theme", theme);
  }, [theme]); // Dépendance : se relance uniquement quand `theme` change

  // useMemo construit l'objet de valeur du contexte — évite les re-rendus inutiles des consommateurs
  const value = useMemo(
    () => ({
      theme, // La valeur courante du thème ("light" ou "dark")
      // toggleTheme : bascule entre "light" et "dark"
      // Utilise la forme fonctionnelle de setTheme pour lire la valeur courante sans la capturer
      toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light")),
    }),
    [theme] // Se recalcule uniquement si `theme` change
  );

  // Le Provider transmet la valeur du contexte à tous les composants enfants
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
