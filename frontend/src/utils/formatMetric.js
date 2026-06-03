// utils/formatMetric.js
// Utilitaire d'affichage des métriques compactes (vues, likes, abonnés…)
// dans le tableau de bord et les statistiques de blog.

// formatCompactMetric(value, t) : traduit le suffixe "k" d'une métrique compacte
//   selon la locale active via la fonction t() de react-i18next.
//
//   value : chaîne représentant une métrique (ex: "12k", "3.4k", "500")
//           Si ce n'est pas une chaîne (ex: nombre brut), on la retourne telle quelle.
//   t     : fonction de traduction i18next — t("metrics.thousandSuffix") retourne
//           le suffixe localisé (ex: "k" en anglais, "k" en français, "K" en arabe…)
//
// Exemples :
//   formatCompactMetric("12k", t) → "12k" (FR) / "12K" (AR)
//   formatCompactMetric(500, t)   → 500 (nombre retourné tel quel)
export function formatCompactMetric(value, t) {
  if (typeof value !== "string") {
    // Valeur non-chaîne (ex: nombre entier brut) : retour sans transformation
    return value;
  }

  // Remplace le suffixe "k" ou "K" en fin de chaîne par la traduction localisée
  return value.replace(/k$/i, t("metrics.thousandSuffix"));
}
