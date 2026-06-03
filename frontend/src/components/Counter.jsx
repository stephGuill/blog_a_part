// useState : gère le compteur local du composant
import { useState } from "react";

// Composant Counter : compteur simple incrémental.
// Composant de démonstration créé par le template Vite — non utilisé en production.
export default function Counter() {
  // count : valeur courante du compteur (démarre à 0)
  const [count, setCount] = useState(0);

  return (
    <p>
      {/* Bouton : incrémente le compteur via la forme fonctionnelle de setCount */}
      <button
        type="button"
        onClick={() => setCount((oldCount) => oldCount + 1)}
      >
        count is: {count}
      </button>
    </p>
  );
}
