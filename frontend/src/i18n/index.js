// Importation de la librairie i18next : moteur d'internationalisation côté client
import i18n from "i18next";
// Plugin qui détecte automatiquement la langue préférée de l'utilisateur
// (inspecte localStorage, les préférences du navigateur, et l'attribut lang de <html>)
import LanguageDetector from "i18next-browser-languagedetector";
// Plugin qui lie i18next au système React (fournit useTranslation, Trans, withTranslation...)
import { initReactI18next } from "react-i18next";

// Import des fichiers de traduction JSON pour chaque langue supportée
import ar from "./locales/ar.json"; // Traductions en arabe
import en from "./locales/en.json"; // Traductions en anglais
import es from "./locales/es.json"; // Traductions en espagnol
import fr from "./locales/fr.json"; // Traductions en français

// Objet regroupant toutes les ressources de traduction, organisées par code de langue ISO
// Chaque entrée utilise le namespace par défaut "translation"
const resources = {
  ar: { translation: ar }, // Ressources arabes sous le namespace "translation"
  en: { translation: en }, // Ressources anglaises sous le namespace "translation"
  es: { translation: es }, // Ressources espagnoles sous le namespace "translation"
  fr: { translation: fr }, // Ressources françaises sous le namespace "translation"
};

// Chaîne de configuration i18next (pattern builder)
i18n
  // Ajout du plugin de détection automatique de la langue du navigateur
  .use(LanguageDetector)
  // Ajout du plugin React pour exposer useTranslation et les composants de traduction
  .use(initReactI18next)
  // Initialisation de i18next avec la configuration complète
  .init({
    // Ressources de traduction chargées en mémoire (pas de chargement asynchrone via HTTP)
    resources,
    // Langue de secours si la langue détectée n'est pas supportée ou si une clé est manquante
    fallbackLng: "fr",
    // Liste des langues autorisées (toute autre langue sera remplacée par fallbackLng)
    supportedLngs: ["fr", "en", "ar", "es"],
    // Configuration de l'interpolation (remplacement de variables dans les chaînes de traduction)
    interpolation: {
      // Désactive l'échappement HTML automatique car React gère déjà ce cas (prévient le double échappement)
      escapeValue: false,
    },
    // Configuration du plugin LanguageDetector
    detection: {
      // Ordre de priorité pour la détection de la langue :
      // 1. localStorage (langue sauvegardée manuellement par l'utilisateur)
      // 2. navigator (préférence de langue du navigateur)
      // 3. htmlTag (attribut lang de la balise <html>)
      order: ["localStorage", "navigator", "htmlTag"],
      // Nom de la clé localStorage où la langue choisie est persistée entre les sessions
      lookupLocalStorage: "blogyoo_language",
      // Mécanismes de cache utilisés pour mémoriser la langue détectée
      caches: ["localStorage"],
    },
  });

// Événement déclenché à chaque changement de langue (manuel ou automatique)
i18n.on("languageChanged", (language) => {
  // Met à jour l'attribut lang de la balise <html> pour l'accessibilité et le référencement
  document.documentElement.lang = language;
  // Met à jour la direction du texte : RTL (droite à gauche) pour l'arabe, LTR pour toutes les autres langues
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
});

// Export de l'instance i18n configurée (peut être importée pour des traductions hors composants React)
export default i18n;
