// LogIn : icône de connexion affichée dans le bouton de soumission
import { LogIn } from "lucide-react";

// useState : gère les états locaux du formulaire (données, erreurs, chargement, 2FA)
import { useState } from "react";

// Link : composant React Router pour la navigation sans rechargement de page
// useNavigate : hook React Router pour la redirection programmatique après connexion
import { Link, useNavigate } from "react-router-dom";

// Hook personnalisé d'accès aux fonctions d'authentification du contexte
import { useAuth } from "@hooks/useAuth";

// Composant Input générique pour les champs texte
import Input from "@components/ui/Input/Input";

// Composant champ mot de passe avec bascule afficher/masquer
import PasswordInput from "@components/auth/PasswordInput";

// Composant boutons de connexion sociale (Google, Facebook, Apple)
import SocialLoginButtons from "@components/auth/SocialLoginButtons";

// Utilitaire qui détermine la page de redirection selon le rôle de l'utilisateur
import { getRedirectPathByRole } from "@utils/roleRedirect";

// Styles CSS spécifiques au formulaire de connexion
import "./SigninForm.css";

// Composant formulaire de connexion (email/pseudo + mot de passe + 2FA optionnel)
function SigninForm() {
  // useNavigate retourne une fonction pour naviguer programmatiquement après la connexion
  const navigate = useNavigate();

  // Extraction des fonctions de connexion et de vérification 2FA depuis le contexte d'auth
  const { signin, verifyTwoFactorLogin } = useAuth();

  // Formulaire contrôlé : chaque champ est lié à une clé du state formData
  // login : peut être un email ou un pseudo
  const [formData, setFormData] = useState({ login: "", password: "" });

  // Code de double authentification saisi par l'utilisateur lors de l'étape 2FA
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Token temporaire reçu après la première étape de connexion si 2FA est requis
  // Sa présence indique qu'on est à l'étape de validation du code 2FA
  const [temporaryToken, setTemporaryToken] = useState("");

  // Message d'erreur à afficher si la connexion échoue
  const [error, setError] = useState("");

  // Indicateur de soumission en cours : désactive le bouton pour éviter les doubles envois
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestionnaire générique de changement de champ
  // Utilise event.target.name pour identifier dynamiquement quel champ a changé
  // Forme fonctionnelle de setState pour conserver les autres champs intacts
  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,                              // Conserve les valeurs des autres champs
      [event.target.name]: event.target.value, // Met à jour uniquement le champ modifié
    }));
  };

  // Gestionnaire de soumission du formulaire — gère les deux étapes (connexion + 2FA)
  const handleSubmit = async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page (comportement natif du formulaire)
    setError("");            // Efface toute erreur précédente
    setIsSubmitting(true);   // Désactive le bouton de soumission

    try {
      // Branchement selon l'étape courante :
      // Si temporaryToken existe → on est à l'étape 2FA, on valide le code
      // Sinon → première connexion avec login + mot de passe
      const response = temporaryToken
        ? await verifyTwoFactorLogin({ temporaryToken, code: twoFactorCode })
        : await signin(formData);

      // Si la réponse indique que le 2FA est requis, on stocke le token temporaire
      // et on reste sur le formulaire pour afficher le champ de code 2FA
      if (response.requiresTwoFactor) {
        setTemporaryToken(response.temporaryToken);
        return; // On sort de la fonction sans rediriger
      }

      // Connexion réussie : redirection vers le tableau de bord ou la page selon le rôle
      // response.redirectTo : URL de redirection suggérée par le backend (ex: OAuth callback)
      // getRedirectPathByRole : calcule le chemin selon le rôle de l'utilisateur
      navigate(response.redirectTo || getRedirectPathByRole(response.user?.role), { replace: true });
    } catch (err) {
      // En cas d'erreur (identifiants incorrects, compte bloqué...), affiche le message d'erreur
      setError(err.message || "Connexion impossible.");
    } finally {
      // Dans tous les cas, réactive le bouton de soumission
      setIsSubmitting(false);
    }
  };

  return (
    // Formulaire de connexion — onSubmit déclenche handleSubmit
    <form className="form-card" onSubmit={handleSubmit}>
      {/* Rendu conditionnel : affiche le message d'erreur uniquement s'il y en a un */}
      {error ? <p className="auth-error">{error}</p> : null}

      {/* Rendu conditionnel : champ de code 2FA affiché uniquement si temporaryToken est présent */}
      {temporaryToken ? (
        <Input
          id="twoFactorCode"
          label="Code de double authentification"
          name="twoFactorCode"
          onChange={(event) => setTwoFactorCode(event.target.value)} // Mise à jour du code 2FA
          value={twoFactorCode} // Valeur contrôlée
        />
      ) : null}

      {/* Champ email ou pseudo — formulaire contrôlé via handleChange */}
      <Input id="login" label="E-mail ou pseudo" name="login" onChange={handleChange} value={formData.login} />

      {/* Champ mot de passe avec bascule visibilité — formulaire contrôlé via handleChange */}
      <PasswordInput id="password" label="Mot de passe" name="password" onChange={handleChange} value={formData.password} />

      {/* Lien "Mot de passe oublié" aligné à droite */}
      <div className="auth-form__links">
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </div>

      {/* Bouton de soumission — désactivé pendant la soumission pour éviter les doubles envois */}
      {/* Le texte change selon l'état courant : connexion normale, 2FA, ou en cours */}
      <button className="button button--primary" disabled={isSubmitting} type="submit">
        <LogIn size={16} />
        {isSubmitting ? "Connexion..." : temporaryToken ? "Valider le code" : "Connexion"}
      </button>

      {/* Boutons de connexion sociale masqués pendant l'étape 2FA */}
      {!temporaryToken ? <SocialLoginButtons /> : null}

      {/* Lien de redirection vers la page d'inscription */}
      <p className="auth-form__switch">
        Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
      </p>
    </form>
  );
}

export default SigninForm;
