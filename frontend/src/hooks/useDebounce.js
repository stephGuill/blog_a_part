// Import des hooks React nécessaires pour gérer les effets de bord et l'état local
import { useEffect, useState } from "react";

// Hook personnalisé useDebounce : retarde la mise à jour d'une valeur après une période d'inactivité
// Utile pour éviter de déclencher des appels API à chaque frappe clavier (ex : recherche en direct)
// Paramètres :
//   value - valeur à debouncer (ex : texte d'un champ de recherche)
//   delay - délai en millisecondes avant la mise à jour (300 ms par défaut)
// Retourne : la valeur debouncée (mise à jour seulement après la fin du délai d'inactivité)
export function useDebounce(value, delay = 300) {
  // État stockant la valeur debouncée (initialisée avec la valeur courante)
  const [debouncedValue, setDebouncedValue] = useState(value);

  // useEffect : se re-déclenche à chaque changement de value ou de delay
  useEffect(() => {
    // Crée un timer qui met à jour la valeur debouncée après le délai spécifié
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    // Fonction de nettoyage : annule le timer si value change avant la fin du délai
    // C'est le mécanisme central du debounce : annuler et recommencer à chaque frappe
    return () => window.clearTimeout(timeout);
  }, [delay, value]); // Re-déclenche si la valeur à debouncer ou le délai changent

  // Retourne la valeur stabilisée (ne change que si l'utilisateur arrête de taper pendant `delay` ms)
  return debouncedValue;
}
