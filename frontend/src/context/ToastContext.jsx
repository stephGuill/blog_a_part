// Importation des hooks React nécessaires pour le contexte de notifications
import { createContext, useMemo, useState } from "react";

// Création du contexte de notifications toast avec des valeurs par défaut
// Les toasts sont des messages temporaires affichés à l'utilisateur (succès, erreur, info)
export const ToastContext = createContext({ toasts: [], pushToast: () => {}, clearToasts: () => {} });

// Composant fournisseur des toasts — rend disponible la liste et les actions à tous les enfants
export function ToastProvider({ children }) {
  // useState gère la liste des toasts actuellement affichés
  // Tableau vide au démarrage : aucun toast visible
  const [toasts, setToasts] = useState([]);

  // useMemo construit l'objet de valeur du contexte
  // Évite de recréer l'objet et ses fonctions à chaque rendu du Provider
  const value = useMemo(
    () => ({
      toasts, // La liste courante des objets toast à afficher
      // pushToast : ajoute un nouveau toast à la liste
      // Utilise la forme fonctionnelle pour s'appuyer sur l'état courant (current)
      // Date.now() génère un identifiant unique basé sur le timestamp actuel
      pushToast: (toast) => setToasts((current) => [...current, { id: Date.now(), ...toast }]),
      // clearToasts : vide la liste de tous les toasts (ex: au changement de page)
      clearToasts: () => setToasts([]),
    }),
    [toasts] // Se recalcule uniquement si le tableau de toasts change
  );

  // Le Provider expose les toasts et les actions à tous les composants enfants
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
