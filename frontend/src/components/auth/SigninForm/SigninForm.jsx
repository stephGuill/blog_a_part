import { LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@hooks/useAuth";
import Input from "@components/ui/Input/Input";
import PasswordInput from "@components/auth/PasswordInput";
import SocialLoginButtons from "@components/auth/SocialLoginButtons";
import { getRedirectPathByRole } from "@utils/roleRedirect";

import "./SigninForm.css";

function SigninForm() {
  const navigate = useNavigate();
  const { signin, verifyTwoFactorLogin } = useAuth();
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [temporaryToken, setTemporaryToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = temporaryToken
        ? await verifyTwoFactorLogin({ temporaryToken, code: twoFactorCode })
        : await signin(formData);

      if (response.requiresTwoFactor) {
        setTemporaryToken(response.temporaryToken);
        return;
      }

      navigate(response.redirectTo || getRedirectPathByRole(response.user?.role), { replace: true });
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error ? <p className="auth-error">{error}</p> : null}
      {temporaryToken ? (
        <Input
          id="twoFactorCode"
          label="Code de double authentification"
          name="twoFactorCode"
          onChange={(event) => setTwoFactorCode(event.target.value)}
          value={twoFactorCode}
        />
      ) : null}
      <Input id="login" label="E-mail ou pseudo" name="login" onChange={handleChange} value={formData.login} />
      <PasswordInput id="password" label="Mot de passe" name="password" onChange={handleChange} value={formData.password} />
      <div className="auth-form__links">
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </div>
      <button className="button button--primary" disabled={isSubmitting} type="submit">
        <LogIn size={16} />
        {isSubmitting ? "Connexion..." : temporaryToken ? "Valider le code" : "Connexion"}
      </button>
      {!temporaryToken ? <SocialLoginButtons /> : null}
      <p className="auth-form__switch">
        Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
      </p>
    </form>
  );
}

export default SigninForm;
