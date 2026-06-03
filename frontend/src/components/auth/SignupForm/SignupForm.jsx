// UserPlus : icône d'ajout d'utilisateur affichée dans le bouton de soumission
import { UserPlus } from "lucide-react";

// useState : gère les états locaux du formulaire (données, erreurs, messages, chargement)
import { useState } from "react";

// useTranslation : hook i18next pour accéder aux traductions selon la langue courante
import { useTranslation } from "react-i18next";

// Link : navigation sans rechargement, useNavigate : redirection programmatique
import { Link, useNavigate } from "react-router-dom";

// Hook d'accès à la fonction d'inscription depuis le contexte d'authentification
import { useAuth } from "@hooks/useAuth";

// Composant Input générique pour les champs texte standards
import Input from "@components/ui/Input/Input";

// Composant de téléchargement et prévisualisation d'avatar
import AvatarUpload from "@components/auth/AvatarUpload";

// Composant champ mot de passe avec bascule visibilité
import PasswordInput from "@components/auth/PasswordInput";

// Composant boutons de connexion sociale (Google, Facebook, Apple)
import SocialLoginButtons from "@components/auth/SocialLoginButtons";

// Utilitaires de gestion du consentement légal :
// buildSignupConsentPayload : construit l'objet consentement à envoyer au backend
// hasRequiredLegalConsent : vérifie si l'utilisateur a déjà accepté les CGU/politique
// saveLegalConsent : sauvegarde le consentement dans localStorage
import { buildSignupConsentPayload, hasRequiredLegalConsent, saveLegalConsent } from "@utils/legalConsent";

// Styles CSS spécifiques au formulaire d'inscription
import "./SignupForm.css";

// Composant formulaire d'inscription complet
function SignupForm() {
  // useNavigate : fonction de redirection programmatique après l'inscription réussie
  const navigate = useNavigate();

  // t : fonction de traduction — t("clé") retourne le texte traduit selon la langue active
  const { t } = useTranslation();

  // Extraction de la fonction signup depuis le contexte d'authentification
  const { signup } = useAuth();

  // État du formulaire contrôlé : toutes les valeurs des champs sont stockées ici
  const [formData, setFormData] = useState({
    confirmPassword: "", // Confirmation du mot de passe (validée côté frontend)
    email: "",           // Adresse email unique de l'utilisateur
    full_name: "",       // Nom complet (prénom + nom)
    password: "",        // Mot de passe choisi
    username: "",        // Pseudo unique de l'utilisateur
  });

  // Initialisation lazy : vérifie si le consentement légal est déjà sauvegardé dans localStorage
  // Évite à l'utilisateur de re-cocher la case s'il a déjà accepté lors d'une session précédente
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(() => hasRequiredLegalConsent());

  // Fichier avatar sélectionné (objet File ou null) — géré par le composant AvatarUpload
  const [avatarFile, setAvatarFile] = useState(null);

  // Message de succès affiché après une inscription réussie
  const [message, setMessage] = useState("");

  // Message d'erreur affiché si l'inscription échoue ou si la validation échoue
  const [error, setError] = useState("");

  // Indicateur de soumission en cours : désactive le bouton pour éviter les doubles envois
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestionnaire générique de changement de champ
  // Utilise event.target.name pour identifier dynamiquement quel champ a changé
  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,                              // Conserve les valeurs des autres champs
      [event.target.name]: event.target.value, // Met à jour uniquement le champ modifié
    }));
  };

  // Gestionnaire de soumission du formulaire d'inscription
  const handleSubmit = async (event) => {
    event.preventDefault(); // Empêche le rechargement natif de la page
    setError("");            // Réinitialise les messages d'erreur et de succès
    setMessage("");

    // Validation 1 : l'utilisateur doit avoir accepté les CGU et la politique de confidentialité
    if (!hasAcceptedLegal) {
      setError(t("auth.legal.required")); // Message traduit demandant l'acceptation
      return;
    }

    // Validation 2 : les deux mots de passe doivent être identiques (vérification côté client)
    if (formData.password !== formData.confirmPassword) {
      setError("Les deux mots de passe doivent etre identiques.");
      return;
    }

    setIsSubmitting(true); // Désactive le bouton pendant l'envoi

    try {
      // Si l'utilisateur vient d'accepter mais que ce n'est pas encore dans localStorage,
      // on sauvegarde le consentement avec les valeurs minimales requises
      if (hasAcceptedLegal && !hasRequiredLegalConsent()) {
        saveLegalConsent({
          acceptedTerms: true,                                    // CGU acceptées
          acceptedPrivacy: true,                                  // Politique de confidentialité acceptée
          marketingConsent: false,                                // Marketing non consenti par défaut
          cookiesConsent: { analytics: false, marketing: false }, // Cookies non consentis par défaut
        });
      }

      // Construction du payload de consentement à envoyer au backend
      const consentPayload = buildSignupConsentPayload();

      // Construction du FormData multipart (nécessaire pour envoyer l'avatar comme fichier)
      const payload = new FormData();

      // Ajout de toutes les données du formulaire et du consentement dans le FormData
      // Les objets sont sérialisés en JSON car FormData ne supporte que les chaînes et Blobs
      Object.entries({ ...formData, ...consentPayload }).forEach(([key, value]) => {
        payload.append(key, typeof value === "object" ? JSON.stringify(value) : value);
      });

      // Ajout du fichier avatar uniquement s'il a été sélectionné
      if (avatarFile) {
        payload.append("avatar", avatarFile); // Le backend reçoit un fichier multipart
      }

      // Envoi du payload au backend via le service d'authentification
      await signup(payload);

      // Affichage du message de succès traduit
      setMessage(t("auth.signupSuccess"));

      // Redirection vers la page de connexion après inscription réussie
      navigate("/signin", { replace: true });
    } catch (err) {
      // En cas d'erreur (email déjà utilisé, pseudo pris...), affiche le message d'erreur
      setError(err.message || t("auth.signupError"));
    } finally {
      // Dans tous les cas, réactive le bouton de soumission
      setIsSubmitting(false);
    }
  };

  return (
    // Formulaire d'inscription — onSubmit déclenche handleSubmit
    <form className="form-card" onSubmit={handleSubmit}>
      {/* Rendu conditionnel : affiche l'erreur uniquement si elle existe */}
      {error ? <p className="auth-error">{error}</p> : null}

      {/* Rendu conditionnel : affiche le message de succès uniquement s'il existe */}
      {message ? <p className="auth-success">{message}</p> : null}

      {/* Composant d'upload d'avatar : gère la sélection, validation et prévisualisation */}
      {/* file : fichier courant, onChange : mise à jour de avatarFile, onError : erreurs de validation */}
      <AvatarUpload file={avatarFile} onChange={setAvatarFile} onError={setError} />

      {/* Champ pseudo — label traduit via useTranslation */}
      <Input id="username" label={t("auth.username")} name="username" onChange={handleChange} value={formData.username} />

      {/* Champ nom complet — label traduit */}
      <Input id="full_name" label={t("auth.fullName")} name="full_name" onChange={handleChange} value={formData.full_name} />

      {/* Champ email — type="email" active la validation native du navigateur */}
      <Input id="email" label={t("auth.email")} name="email" onChange={handleChange} type="email" value={formData.email} />

      {/* Champ mot de passe — autoComplete="new-password" empêche l'autocomplétion avec l'ancien mdp */}
      <PasswordInput
        autoComplete="new-password"
        id="password"
        label={t("auth.password")}
        name="password"
        onChange={handleChange}
        value={formData.password}
      />

      {/* Champ confirmation de mot de passe — comparé à formData.password dans handleSubmit */}
      <PasswordInput
        autoComplete="new-password"
        id="confirmPassword"
        label="Confirmer le mot de passe"
        name="confirmPassword"
        onChange={handleChange}
        value={formData.confirmPassword}
      />

      {/* Case à cocher pour l'acceptation des CGU, mentions légales et politique de confidentialité */}
      {/* htmlFor="acceptLegal" lie le label à l'input pour que le clic sur le texte coche la case */}
      <label className="auth-legal" htmlFor="acceptLegal">
        {/* Checkbox contrôlée : checked est lié à hasAcceptedLegal */}
        <input
          checked={hasAcceptedLegal}  // Valeur contrôlée par le state
          id="acceptLegal"
          name="acceptLegal"
          onChange={(event) => setHasAcceptedLegal(event.target.checked)} // Mise à jour booléenne
          type="checkbox"
        />
        {/* Texte légal avec liens cliquables vers les pages de mentions légales */}
        <span>
          {t("auth.legal.prefix")}{" "}
          {/* Lien vers la page des mentions légales */}
          <Link to="/mentions-legales" title={t("auth.legal.legalNotice")}>
            {t("auth.legal.legalNotice")}
          </Link>
          ,{" "}
          {/* Lien vers la page des CGU */}
          <Link to="/conditions-utilisation" title={t("auth.legal.terms")}>
            {t("auth.legal.terms")}
          </Link>{" "}
          {t("auth.legal.and")}{" "}
          {/* Lien vers la politique de confidentialité */}
          <Link to="/politique-confidentialite" title={t("auth.legal.privacy")}>
            {t("auth.legal.privacy")}
          </Link>
          .
        </span>
      </label>

      {/* Bouton de soumission — désactivé si en cours d'envoi OU si les CGU ne sont pas acceptées */}
      <button className="button button--primary" disabled={isSubmitting || !hasAcceptedLegal} type="submit">
        <UserPlus size={16} />
        {/* Texte dynamique : "En cours..." pendant la soumission, texte normal sinon */}
        {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
      </button>

      {/* Boutons de connexion sociale (Google, Facebook, Apple) */}
      <SocialLoginButtons />

      {/* Lien vers la page de connexion pour les utilisateurs déjà inscrits */}
      <p className="auth-form__switch">
        {t("auth.alreadyAccount")} <Link to="/signin">{t("nav.signin")}</Link>
      </p>
    </form>
  );
}

export default SignupForm;
