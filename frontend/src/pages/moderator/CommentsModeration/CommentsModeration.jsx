// Icônes lucide-react : Check (approuver), EyeOff (masquer), Trash2 (supprimer)
import { Check, EyeOff, Trash2 } from "lucide-react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de priorité ou statut avec couleur sémantique
import Badge from "@components/ui/Badge/Badge";
// Table : tableau générique avec colonnes personnalisables
import Table from "@components/ui/Table/Table";
// Données fictives des commentaires (auteur, article, priorité, statut, contenu)
import { mockComments } from "@utils/mockData";

// Styles CSS propres à la page de modération des commentaires
import "./CommentsModeration.css";

// Composant page : file de modération des commentaires accessible au modérateur
function CommentsModeration() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  // Définition des colonnes du tableau de modération
  // Chaque colonne : clé de données, label traduit, et rendu optionnel personnalisé
  const columns = [
    // Colonne auteur : pseudo ou nom de l'utilisateur ayant posté le commentaire
    { key: "author", label: t("table.author") },
    // Colonne article cible : titre de l'article concerné par le commentaire
    { key: "article", label: t("table.targetArticle") },
    {
      key: "priority",
      label: t("table.priority"),
      // render : Badge rouge ("danger") pour priorité haute, orange ("warning") pour les autres
      render: (row) => (
        <Badge tone={row.priority === "haute" ? "danger" : "warning"}>
          {t(`priority.${row.priority}`, row.priority)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      // render : Badge bleu informatif pour afficher le statut actuel du commentaire
      render: (row) => (
        <Badge tone="info">{t(`status.${row.status}`, row.status)}</Badge>
      ),
    },
    // Colonne contenu brut du commentaire à modérer
    { key: "content", label: t("nav.comments") },
    {
      key: "actions",
      label: t("table.actions"),
      // render : trois boutons d'action inline — approuver, masquer, supprimer
      render: () => (
        <div className="table-actions">
          {/* Bouton approuver : valide le commentaire, le rend visible publiquement */}
          <button aria-label={t("status.approved")}><Check size={16} /></button>
          {/* Bouton masquer : cache le commentaire sans le supprimer définitivement */}
          <button aria-label={t("actions.hide")}><EyeOff size={16} /></button>
          {/* Bouton supprimer : efface définitivement le commentaire de la base */}
          <button aria-label={t("common.delete")}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    // Section principale de la page de modération des commentaires
    <section className="by-page comments-moderation">

      {/* En-tête : titre de la file de modération */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit (ex : "Commentaires") */}
          <div className="by-eyebrow">{t("nav.comments")}</div>
          {/* Titre principal traduit (ex : "File de modération") */}
          <h1>{t("pages.commentsModeration.title")}</h1>
        </div>
      </header>

      {/* Tableau de modération : reçoit les colonnes définies et les données fictives */}
      {/* mockComments : tableau de commentaires test avec auteur, article, priorité, statut, contenu */}
      <Table columns={columns} rows={mockComments} />

    </section>
  );
}

// Export par défaut pour le routeur React
export default CommentsModeration;
