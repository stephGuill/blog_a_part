// Icônes lucide-react : Columns3 (grille d'articles), Image (couverture), Type (titre hero)
import { Columns3, Image, Type } from "lucide-react";

// Badge : étiquette de statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable
import Button from "@components/ui/Button/Button";

// Styles CSS propres au builder de blog
import "./BlogBuilder.css";

// Définition des blocs disponibles dans le panneau de gauche du builder
// Chaque bloc a un libellé affiché et une icône Lucide associée
const blocks = [
  { label: "Titre hero", icon: Type },        // Bloc grand titre en haut de page
  { label: "Image couverture", icon: Image }, // Bloc image pleine largeur de couverture
  { label: "Grille articles", icon: Columns3 }, // Bloc grille d'articles multi-colonnes
];

// Composant page : builder visuel de blog par blocs (interface prototype)
// Permet de composer la mise en page d'un blog via des blocs cliquables
function BlogBuilder() {
  return (
    // Section principale du builder de blog
    <section className="by-page blog-builder">

      {/* En-tête : titre descriptif + bouton de sauvegarde de la composition */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel */}
          <div className="by-eyebrow">Builder</div>
          {/* Titre principal de la page */}
          <h1>Composer un blog par blocs.</h1>
          {/* Description du mode builder : prototype visuel préparant le builder complet */}
          <p className="text-muted">Une base JSON visuelle pour preparer le futur builder complet.</p>
        </div>
        {/* Bouton de sauvegarde de la composition courante */}
        <Button>Sauvegarder</Button>
      </header>

      {/* Grille en 3 colonnes : palette de blocs | zone de prévisualisation | configuration */}
      <div className="builder-grid">

        {/* Panneau gauche : liste des blocs disponibles à insérer dans la composition */}
        <aside className="card-shell builder-panel">
          {/* Libellé de section */}
          <div className="by-eyebrow">Blocs</div>
          {/* Itération sur le tableau de blocs pour générer un bouton par type de bloc */}
          {blocks.map((block) => {
            // Résolution dynamique du composant icône depuis la propriété "icon" du bloc
            const Icon = block.icon;
            return (
              // Bouton de bloc : cliquer sur ce bouton ajouterait le bloc à la composition
              <button className="builder-block" key={block.label} type="button">
                <Icon size={18} /> {block.label}
              </button>
            );
          })}
        </aside>

        {/* Zone centrale : prévisualisation du blog composé avec les blocs insérés */}
        <main className="card-shell builder-preview">
          {/* Badge indiquant le mode aperçu en temps réel */}
          <Badge tone="info">Preview live</Badge>
          {/* Titre d'exemple affiché dans la prévisualisation du blog */}
          <h2>Horizons editoriaux</h2>
          {/* Description éditoriale d'exemple */}
          <p>Un blog clair, immersif, avec une structure qui respecte la lecture longue.</p>
          {/* Représentation simplifiée de 3 cartes articles placeholder */}
          {/* Chaque <span /> représente un placeholder visuel de carte article */}
          <div className="builder-preview__cards"><span /><span /><span /></div>
        </main>

        {/* Panneau droit : configuration du blog (slug et statut de publication) */}
        <aside className="card-shell builder-panel">
          <div className="by-eyebrow">Configuration</div>
          {/* Champ slug : identifiant URL convivial du blog */}
          <label className="field">
            <span>Slug</span>
            <input defaultValue="horizons-editoriaux" />
          </label>
          {/* Sélecteur de statut : publié ou brouillon */}
          <label className="field">
            <span>Statut</span>
            <select defaultValue="published">
              <option value="published">Publie</option>
              <option value="draft">Brouillon</option>
            </select>
          </label>
        </aside>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default BlogBuilder;
