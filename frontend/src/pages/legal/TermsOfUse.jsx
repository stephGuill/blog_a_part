import { Link } from "react-router-dom";

import "./legalPages.css";

const sections = [
  "Objet",
  "Acceptation",
  "Compte utilisateur",
  "Règles de comportement",
  "Rôles et responsabilités",
  "Contenus et modération",
  "Propriété intellectuelle",
  "Suspension",
  "Disponibilité",
  "Contact et droit applicable",
];

function TermsOfUse() {
  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <div className="by-eyebrow">Conditions d'utilisation</div>
        <h1>Conditions d'utilisation de BlogYoo</h1>
        <p>
          Ces conditions encadrent l'accès à BlogYoo, l'utilisation des comptes, les rôles applicatifs et la publication
          de contenus sur la plateforme.
        </p>
        <p className="legal-page__notice">
          Document de travail à vérifier par un professionnel juridique avant exploitation commerciale.
        </p>
        <span className="text-muted">Dernière mise à jour : 25 mai 2026</span>
      </header>

      <div className="legal-page__layout">
        <nav className="legal-page__toc" aria-label="Sommaire des conditions">
          <strong>Sommaire</strong>
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`}>
              {section}
            </a>
          ))}
        </nav>

        <article className="legal-page__content">
          <section className="legal-section" id="objet">
            <h2>Objet</h2>
            <p>
              BlogYoo est une plateforme SaaS permettant de créer, organiser, administrer et modérer des blogs et contenus
              éditoriaux. Les présentes conditions définissent les droits et obligations des utilisateurs.
            </p>
          </section>

          <section className="legal-section" id="acceptation">
            <h2>Acceptation obligatoire</h2>
            <p>
              La création d'un compte suppose l'acceptation préalable des présentes conditions et de la
              <Link to="/politique-confidentialite"> Politique de confidentialité</Link>. Sans acceptation, l'inscription
              ne peut pas être finalisée.
            </p>
          </section>

          <section className="legal-section" id="compte-utilisateur">
            <h2>Accès au service et compte utilisateur</h2>
            <ul>
              <li>L'utilisateur fournit des informations exactes, à jour et non trompeuses.</li>
              <li>Le mot de passe doit rester confidentiel et sécurisé.</li>
              <li>Chaque action réalisée avec un compte peut être journalisée pour des raisons de sécurité.</li>
              <li>Les comptes peuvent disposer de rôles simples ou avancés selon les permissions accordées.</li>
            </ul>
          </section>

          <section className="legal-section" id="règles-de-comportement">
            <h2>Règles de comportement</h2>
            <p>Il est interdit de publier, relayer ou encourager des contenus :</p>
            <ul>
              <li>illégaux, haineux, violents, discriminatoires ou harcelants ;</li>
              <li>diffamatoires, trompeurs ou portant atteinte à la réputation d'un tiers ;</li>
              <li>portant atteinte à la vie privée, aux droits d'auteur, marques ou secrets d'affaires ;</li>
              <li>contenant des logiciels malveillants, tentatives d'hameçonnage ou abus techniques.</li>
            </ul>
          </section>

          <section className="legal-section" id="rôles-et-responsabilités">
            <h2>Rôles et responsabilités</h2>
            <ul>
              <li><strong>Simple user :</strong> peut accéder aux espaces autorisés et interagir selon les règles du site.</li>
              <li><strong>Author :</strong> peut rédiger des contenus selon les droits attribués.</li>
              <li><strong>Owner :</strong> administre ses blogs, membres et paramètres, sans droits globaux plateforme.</li>
              <li><strong>Editor :</strong> gère des articles selon les permissions reçues.</li>
              <li><strong>Moderator :</strong> traite commentaires et signalements autorisés.</li>
              <li><strong>Admin :</strong> gère la plateforme selon les droits prévus.</li>
              <li><strong>Super admin :</strong> dispose des droits les plus sensibles et doit les utiliser avec prudence.</li>
            </ul>
          </section>

          <section className="legal-section" id="contenus-et-modération">
            <h2>Publication, modification, modération et suppression</h2>
            <p>
              BlogYoo peut permettre la publication, la modification, l'archivage, la modération ou la suppression de
              contenus. Les contenus signalés peuvent être examinés par les owners, moderators, admins ou super_admins
              selon leur périmètre d'autorisation.
            </p>
          </section>

          <section className="legal-section" id="propriété-intellectuelle">
            <h2>Propriété intellectuelle des contenus</h2>
            <p>
              Les utilisateurs conservent leurs droits sur les contenus qu'ils publient, sous réserve d'avoir les droits
              nécessaires. Ils accordent à BlogYoo une licence technique non exclusive permettant d'afficher, héberger,
              sauvegarder et diffuser les contenus dans le cadre du service.
            </p>
          </section>

          <section className="legal-section" id="suspension">
            <h2>Suspension ou suppression de compte</h2>
            <p>
              En cas d'abus, de risque de sécurité ou de violation des règles, BlogYoo peut suspendre, restreindre ou
              supprimer un compte. Le travail déjà produit n'est pas automatiquement supprimé, sauf obligation légale ou
              décision de modération justifiée.
            </p>
          </section>

          <section className="legal-section" id="disponibilité">
            <h2>Disponibilité et limitation de responsabilité</h2>
            <p>
              BlogYoo cherche à maintenir un service stable, mais ne garantit pas une disponibilité permanente. Des
              maintenances, incidents ou évolutions techniques peuvent limiter temporairement l'accès.
            </p>
          </section>

          <section className="legal-section" id="contact-et-droit-applicable">
            <h2>Modification, contact et droit applicable</h2>
            <p>
              Les conditions peuvent évoluer. Les utilisateurs seront informés en cas de modification significative.
              Contact : <span className="legal-placeholder">[Email de contact]</span>. Droit applicable : droit français.
            </p>
          </section>
        </article>
      </div>

      <div className="legal-page__crosslinks">
        <Link to="/mentions-legales">Mentions légales</Link>
        <Link to="/politique-confidentialite">Politique de confidentialité</Link>
      </div>
    </main>
  );
}

export default TermsOfUse;
