import { Link } from "react-router-dom";

import "./legalPages.css";

const sections = [
  "Éditeur du site",
  "Responsable de publication",
  "Hébergeur",
  "Contact",
  "Propriété intellectuelle",
  "Responsabilité",
  "Signalement de contenu illicite",
  "Données personnelles et cookies",
  "Droit applicable",
];

function LegalNotice() {
  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <div className="by-eyebrow">Mentions légales</div>
        <h1>Mentions légales de BlogYoo</h1>
        <p>
          Cette page présente les informations légales relatives à l'édition, l'hébergement et l'utilisation publique
          de la plateforme BlogYoo.
        </p>
        <p className="legal-page__notice">
          Ce modèle doit être relu et adapté par un professionnel juridique avant toute mise en production.
        </p>
        <span className="text-muted">Dernière mise à jour : 25 mai 2026</span>
      </header>

      <div className="legal-page__layout">
        <nav className="legal-page__toc" aria-label="Sommaire des mentions légales">
          <strong>Sommaire</strong>
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`}>
              {section}
            </a>
          ))}
        </nav>

        <article className="legal-page__content">
          <section className="legal-section" id="éditeur-du-site">
            <h2>Éditeur du site</h2>
            <p>
              Le site BlogYoo est édité par <span className="legal-placeholder">[Nom de l'entreprise ou du responsable]</span>,
              situé à <span className="legal-placeholder">[Adresse]</span>. Numéro SIRET :
              <span className="legal-placeholder"> [SIRET si applicable]</span>.
            </p>
          </section>

          <section className="legal-section" id="responsable-de-publication">
            <h2>Responsable de publication</h2>
            <p>
              Le responsable de publication est <span className="legal-placeholder">[Nom du responsable]</span>. Il peut
              être contacté à l'adresse <span className="legal-placeholder">[Email de contact]</span>.
            </p>
          </section>

          <section className="legal-section" id="hébergeur">
            <h2>Hébergeur</h2>
            <p>
              Le service est hébergé par <span className="legal-placeholder">[Nom de l'hébergeur]</span>,
              <span className="legal-placeholder"> [Adresse de l'hébergeur]</span>. Les informations techniques
              d'hébergement doivent être complétées avant publication.
            </p>
          </section>

          <section className="legal-section" id="contact">
            <h2>Contact</h2>
            <p>
              Pour toute question concernant BlogYoo, écrivez à <span className="legal-placeholder">[Email de contact]</span>.
            </p>
          </section>

          <section className="legal-section" id="propriété-intellectuelle">
            <h2>Propriété intellectuelle</h2>
            <p>
              L'interface, la marque, les éléments graphiques, les textes institutionnels et les composants propres à
              BlogYoo sont protégés par le droit de la propriété intellectuelle. Les contenus publiés par les utilisateurs
              restent sous leur responsabilité et selon les droits qu'ils détiennent.
            </p>
          </section>

          <section className="legal-section" id="responsabilité">
            <h2>Responsabilité</h2>
            <p>
              BlogYoo met à disposition des outils de création, publication, gestion de rôles et modération. Chaque
              utilisateur demeure responsable des contenus qu'il publie, modifie, valide ou modère.
            </p>
          </section>

          <section className="legal-section" id="signalement-de-contenu-illicite">
            <h2>Signalement de contenu illicite</h2>
            <p>
              Tout contenu manifestement illicite, diffamatoire, discriminatoire, violent ou portant atteinte aux droits
              d'autrui peut être signalé via la page <Link to="/contact">Contact</Link> ou à l'adresse
              <span className="legal-placeholder"> [Email de contact]</span>.
            </p>
          </section>

          <section className="legal-section" id="données-personnelles-et-cookies">
            <h2>Données personnelles et cookies</h2>
            <p>
              Les traitements de données personnelles, cookies et consentements sont détaillés dans la
              <Link to="/politique-confidentialite"> Politique de confidentialité</Link>.
            </p>
          </section>

          <section className="legal-section" id="droit-applicable">
            <h2>Droit applicable</h2>
            <p>
              Les présentes mentions sont soumises au droit français, sauf disposition impérative contraire applicable.
            </p>
          </section>
        </article>
      </div>

      <div className="legal-page__crosslinks">
        <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
        <Link to="/politique-confidentialite">Politique de confidentialité</Link>
      </div>
    </main>
  );
}

export default LegalNotice;
