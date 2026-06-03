// Styles CSS propres à la page des fonctionnalités
import "./Features.css";

// Composant page : page publique "Fonctionnalités" de BlogYoo.
// Affiche les 4 modules principaux de la plateforme sous forme de cartes.
// Note : contenu placeholder — à étoffer avec des descriptions détaillées et icônes.
function Features() {
  return (
    <section className="section">
      {/* Bandeau eyebrow et titre de la section */}
      <div className="eyebrow">Fonctionnalites</div>
      <h1 className="page-title">Les briques principales de BlogYoo.</h1>
      {/* Grille de 4 cartes : une par module de la plateforme */}
      <div className="card-grid">
        {["Blogs publics", "Articles", "Commentaires", "Roles"].map((feature) => (
          // feature sert de clé unique ET de titre de carte
          <article className="content-card" key={feature}>
            <h2 className="card-title">{feature}</h2>
            {/* Texte placeholder — à remplacer par une description réelle de chaque module */}
            <p>Module prevu dans la structure produit.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Export par défaut : composant utilisé par le routeur pour la route "/features"
export default Features;
