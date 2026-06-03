// Styles CSS propres à la page de tarification
import "./Pricing.css";

// Composant page : page publique "Tarifs" de BlogYoo.
// Affiche les 3 offres tarifaires SaaS (Starter, Équipe, Plateforme) sous forme de cartes.
// Note : contenu placeholder — les prix et détails seront définis avec l'équipe produit.
function Pricing() {
  return (
    <section className="section">
      {/* Bandeau eyebrow et titre de la section */}
      <div className="eyebrow">Tarifs</div>
      <h1 className="page-title">Une base SaaS prete pour vos futures offres.</h1>
      {/* Grille des 3 plans tarifaires */}
      <div className="card-grid">
        {["Starter", "Equipe", "Plateforme"].map((plan) => (
          // plan sert de clé unique ET d'identifiant du niveau tarifaire
          <article className="content-card" key={plan}>
            {/* Kicker : nom du plan (ex: Starter, Équipe) */}
            <div className="card-kicker">{plan}</div>
            {/* Titre : prix à définir */}
            <h2 className="card-title">A definir</h2>
            {/* Description placeholder */}
            <p>Le contenu tarifaire sera precise avec votre equipe.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Export par défaut : composant utilisé par le routeur pour la route "/pricing"
export default Pricing;
