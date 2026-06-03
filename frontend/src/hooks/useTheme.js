// Import du hook useContext de React pour consommer la valeur courante d'un contexte
import { useContext } from "react";

// Import du contexte de thème (ThemeContext)
// Il expose : theme, setTheme, isDark, toggleDark, customColors, etc.
import { ThemeContext } from "@context/ThemeContext";

// Hook personnalisé useTheme : raccourci pour accéder au contexte de thème
// Retourne toutes les données et fonctions exposées par ThemeContext
// Utilisation dans un composant : const { isDark, toggleDark } = useTheme();
export const useTheme = () => useContext(ThemeContext);
