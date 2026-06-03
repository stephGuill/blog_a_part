// Icônes lucide-react : éditer, archiver, publier, rechercher
import { Archive, Edit3, Rocket, Search } from "lucide-react";

// Badge : étiquette de statut avec couleur sémantique
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable
import Button from "@components/ui/Button/Button";
// Table : composant de tableau générique avec rendu de colonnes personnalisable
import Table from "@components/ui/Table/Table";

// Styles CSS propres à la liste d'articles
import "./PostsList.css";

// Données de démonstration représentant 3 articles avec des statuts différents
const posts = [
  { id: 1, title: "L'essor de l'IA en 2024", status: "published", category: "Tech", date: "21 mai" },
  { id: 2, title: "Ma critique de Dune", status: "draft", category: "Culture", date: "22 mai" },
  { id: 3, title: "Guide editorial", status: "archived", category: "Equipe", date: "18 mai" },
];

// Composant page : liste des articles de l'éditeur
function PostsList() {
  // Définition des colonnes du tableau : label + clé de donnée + rendu optionnel
  const columns = [
    { key: "title", label: "Article" },
    { key: "category", label: "Categorie" },
    { key: "date", label: "Date" },
    {
      key: "status",
      label: "Statut",
      // render : affiche un Badge coloré selon le statut de l'article
      // tone "success" pour publié, "warning" pour les autres (draft, archived)
      render: (row) => (
        <Badge tone={row.status === "published" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      // render : boutons d'action inline pour éditer, publier et archiver
      render: () => (
        <div className="table-actions">
          <button><Edit3 size={16} /></button>    {/* Bouton modifier */}
          <button><Rocket size={16} /></button>    {/* Bouton publier */}
          <button><Archive size={16} /></button>   {/* Bouton archiver */}
        </div>
      ),
    },
  ];

  return (
    // Section principale de la liste d'articles
    <section className="by-page posts-list">

      {/* En-tête : titre + bouton de création d'un nouvel article */}
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Articles</div>
          <h1>Pipeline de publication.</h1>
        </div>
        <Button icon={Edit3}>Creer</Button>
      </header>

      {/* Barre d'outils : champ de recherche + filtres de statut sous forme de chips */}
      <div className="admin-toolbar card-shell">
        {/* Champ de recherche avec icône loupe intégrée */}
        <label className="admin-search">
          <Search size={17} />
          <input placeholder="Rechercher un article" />
        </label>
        {/* Filtres de statut : Draft, Published, Archived */}
        <div className="chip-row">
          <Badge>Draft</Badge>
          <Badge tone="success">Published</Badge>
          <Badge tone="danger">Archived</Badge>
        </div>
      </div>

      {/* Tableau générique : reçoit les colonnes et les lignes de données */}
      <Table columns={columns} rows={posts} />

    </section>
  );
}

// Export par défaut pour le routeur React
export default PostsList;
