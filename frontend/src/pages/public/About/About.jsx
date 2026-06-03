// useTranslation : hook i18next pour traduire tous les textes de la page selon la langue active
import { useTranslation } from "react-i18next";

// Clés i18n des étapes de la méthodologie affichées dans la liste numérotée
const methodSteps = ["tooling", "layout", "views", "structure"];
// Clés i18n des trois cartes de valeur (structure, design, évolution)
const cards = ["structure", "design", "evolution"];

// Composant page : page "A propos" publique de BlogYoo.
// Structure : grille détail (titre + méthodologie) + cartes de valeur + banneau de stack technique.
function About() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();

  return (
    <section className="section">
      {/* Grille détail : titre/description à gauche + étapes de méthodologie à droite */}
      <div className="detail-grid">
        <div>
          <div className="eyebrow">{t("nav.about")}</div>
          <h1 className="page-title">{t("pages.about.title")}</h1>
          <p className="lead">{t("pages.about.description")}</p>
        </div>

        {/* Panneau latéral : liste numérotée des 4 étapes de la méthode de construction */}
        <aside className="panel">
          <div className="card-kicker">{t("pages.about.method")}</div>
          <ol className="meta-list">
            {methodSteps.map((stepKey, index) => (
              // index + 1 : numérotation affichée (1, 2, 3, 4)
              <li key={stepKey}>
                {index + 1}. {t(`pages.about.methodSteps.${stepKey}`)}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* Grille de 3 cartes de valeur : structure, design, évolution */}
      <div className="card-grid">
        {cards.map((cardKey) => (
          <article className="content-card" key={cardKey}>
            <h2 className="card-title">{t(`pages.about.cards.${cardKey}.title`)}</h2>
            <p>{t(`pages.about.cards.${cardKey}.text`)}</p>
          </article>
        ))}
      </div>

      {/* Banneau de stack technique : chips affichant les technos du projet */}
      <div className="content-card" style={{ marginTop: 36 }}>
        <div className="card-kicker">{t("pages.about.visibleStack")}</div>
        <div className="chip-row" style={{ marginTop: 18 }}>
          <span className="chip chip--dark">React 18</span>
          <span className="chip chip--dark">{t("footer.reactRouter")}</span>
          <span className="chip chip--dark">Tailwind CSS v4</span>
          <span className="chip chip--dark">API REST Node/Express</span>
        </div>
      </div>
    </section>
  );
}

// Export par défaut : composant utilisé par le routeur pour la route "/about"
export default About;
