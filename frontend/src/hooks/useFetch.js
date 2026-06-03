// Import des hooks React nécessaires pour gérer les effets de bord et l'état local
import { useEffect, useState } from "react";

// Hook personnalisé useFetch : gère le cycle de vie complet d'un appel API asynchrone
// Paramètres :
//   fetcher      - fonction sans argument retournant une Promise (ex : () => apiClient.get('/posts'))
//   dependencies - tableau de dépendances pour re-déclencher l'appel (comme useEffect)
// Retourne : { data, error, isLoading }
export function useFetch(fetcher, dependencies = []) {
  // État contenant les données retournées par l'API après un appel réussi (null par défaut)
  const [data, setData] = useState(null);
  // État contenant l'erreur levée en cas d'échec de la requête (null par défaut)
  const [error, setError] = useState(null);
  // État indiquant si la requête est en cours (true par défaut car elle démarre immédiatement)
  const [isLoading, setIsLoading] = useState(true);

  // useEffect : déclenche l'appel API au montage du composant et à chaque changement de dépendances
  useEffect(() => {
    // Réinitialise l'état de chargement à true avant chaque nouvel appel
    setIsLoading(true);
    fetcher()
      .then(setData)    // En cas de succès : stocke les données dans l'état data
      .catch(setError)  // En cas d'erreur : stocke l'erreur dans l'état error
      .finally(() => setIsLoading(false)); // Dans tous les cas : arrête l'indicateur de chargement
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Retourne les trois états pour que le composant consommateur puisse réagir à chacun
  return { data, error, isLoading };
}
