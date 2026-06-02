import { Link } from "react-router-dom";

import "./legalPages.css";

const sections = [
  "Responsable du traitement",
  "Données collectées",
  "Finalités",
  "Bases légales",
  "Durées de conservation",
  "Droits utilisateurs",
  "Sécurité",
  "Partage et sous-traitants",
  "Cookies",
  "Mineurs et contact RGPD",
];

function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <div className="by-eyebrow">Confidentialité</div>
        <h1>Politique de confidentialité BlogYoo</h1>
        <p>
          Cette politique explique comment BlogYoo collecte, utilise, sécurise et conserve les données personnelles dans
          le cadre d'une plateforme de blogs, rôles, contenus et modération.
        </p>
        <p className="legal-page__notice">
          Cette version RGPD doit être validée par un professionnel juridique avant toute mise en production.
        </p>
        <span className="text-muted">Dernière mise à jour : 25 mai 2026</span>
      </header>

      <div className="legal-page__layout">
        <nav className="legal-page__toc" aria-label="Sommaire confidentialité">
          <strong>Sommaire</strong>
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`}>
              {section}
            </a>
          ))}
        </nav>

        <article className="legal-page__content">
          <section className="legal-section" id="responsable-du-traitement">
            <h2>Responsable du traitement</h2>
            <p>
              Le responsable du traitement est <span className="legal-placeholder">[Nom de l'entreprise ou du responsable]</span>,
              joignable à <span className="legal-placeholder">[Email RGPD]</span>.
            </p>
          </section>

          <section className="legal-section" id="données-collectées">
            <h2>Données collectées</h2>
            <ul>
              <li>identité : nom, prénom ou nom complet si fourni ;</li>
              <li>compte : username, email, mot de passe hashé, rôle utilisateur, statut ;</li>
              <li>contenus : blogs, articles, commentaires, médias, signalements ;</li>
              <li>sécurité : logs de connexion, adresse IP, User-Agent si activés ;</li>
              <li>préférences : consentements RGPD, cookies, langue, préférences produit.</li>
            </ul>
          </section>

          <section className="legal-section" id="finalités">
            <h2>Finalités du traitement</h2>
            <ul>
              <li>création et authentification du compte ;</li>
              <li>gestion des rôles, permissions et espaces de blogs ;</li>
              <li>publication, édition, modération et suppression de contenus ;</li>
              <li>sécurité, prévention des abus et journalisation d'actions sensibles ;</li>
              <li>respect des obligations légales et amélioration du service.</li>
            </ul>
          </section>

          <section className="legal-section" id="bases-légales">
            <h2>Bases légales RGPD</h2>
            <p>
              Les traitements peuvent reposer sur l'exécution du contrat, le consentement, l'intérêt légitime de BlogYoo
              à sécuriser son service, ou une obligation légale.
            </p>
          </section>

          <section className="legal-section" id="durées-de-conservation">
            <h2>Durées de conservation</h2>
            <p>
              Les données de compte sont conservées pendant la durée d'utilisation du service. Les logs et audit logs sont
              conservés pour une durée proportionnée aux besoins de sécurité et de preuve. Les contenus peuvent rester
              associés au blog tant qu'ils ne sont pas supprimés ou archivés selon les règles applicables.
            </p>
          </section>

          <section className="legal-section" id="droits-utilisateurs">
            <h2>Droits des utilisateurs</h2>
            <p>Conformément au RGPD, vous pouvez demander :</p>
            <ul>
              <li>l'accès, la rectification ou la suppression de vos données ;</li>
              <li>l'opposition, la limitation ou la portabilité ;</li>
              <li>le retrait du consentement lorsque le traitement repose sur celui-ci ;</li>
              <li>une réclamation auprès de la CNIL.</li>
            </ul>
          </section>

          <section className="legal-section" id="sécurité">
            <h2>Sécurité des données</h2>
            <p>
              BlogYoo prévoit une authentification protégée, des mots de passe hashés, des permissions par rôle, des
              contrôles d'accès et des journaux d'audit pour les actions sensibles.
            </p>
          </section>

          <section className="legal-section" id="partage-et-sous-traitants">
            <h2>Partage des données et sous-traitants</h2>
            <p>
              Les données peuvent être transmises à des sous-traitants techniques strictement nécessaires, notamment
              l'hébergeur <span className="legal-placeholder">[Nom de l'hébergeur]</span>. BlogYoo ne vend pas les données
              personnelles.
            </p>
          </section>

          <section className="legal-section" id="cookies">
            <h2>Cookies</h2>
            <p>
              Les cookies essentiels assurent le fonctionnement du service. Les cookies non essentiels, statistiques ou
              marketing, doivent être soumis à consentement préalable lorsqu'ils sont activés.
            </p>
          </section>

          <section className="legal-section" id="mineurs-et-contact-rgpd">
            <h2>Mineurs, modification et contact RGPD</h2>
            <p>
              BlogYoo n'est pas destiné aux mineurs sans autorisation adaptée. Cette politique peut évoluer. Pour exercer
              vos droits : <span className="legal-placeholder">[Email RGPD]</span>.
            </p>
          </section>
        </article>
      </div>

      <div className="legal-page__crosslinks">
        <Link to="/mentions-legales">Mentions légales</Link>
        <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
      </div>
    </main>
  );
}

export default PrivacyPolicy;
