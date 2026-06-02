import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@hooks/useAuth";
import Input from "@components/ui/Input/Input";
import AvatarUpload from "@components/auth/AvatarUpload";
import PasswordInput from "@components/auth/PasswordInput";
import SocialLoginButtons from "@components/auth/SocialLoginButtons";
import { buildSignupConsentPayload, hasRequiredLegalConsent, saveLegalConsent } from "@utils/legalConsent";

import "./SignupForm.css";

function SignupForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    confirmPassword: "",
    email: "",
    full_name: "",
    password: "",
    username: "",
  });
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(() => hasRequiredLegalConsent());
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState("");
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
    setMessage("");

    if (!hasAcceptedLegal) {
      setError(t("auth.legal.required"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les deux mots de passe doivent etre identiques.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (hasAcceptedLegal && !hasRequiredLegalConsent()) {
        saveLegalConsent({
          acceptedTerms: true,
          acceptedPrivacy: true,
          marketingConsent: false,
          cookiesConsent: { analytics: false, marketing: false },
        });
      }

      const consentPayload = buildSignupConsentPayload();
      const payload = new FormData();
      Object.entries({ ...formData, ...consentPayload }).forEach(([key, value]) => {
        payload.append(key, typeof value === "object" ? JSON.stringify(value) : value);
      });

      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }

      await signup(payload);
      setMessage(t("auth.signupSuccess"));
      navigate("/signin", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.signupError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
      <AvatarUpload file={avatarFile} onChange={setAvatarFile} onError={setError} />
      <Input id="username" label={t("auth.username")} name="username" onChange={handleChange} value={formData.username} />
      <Input id="full_name" label={t("auth.fullName")} name="full_name" onChange={handleChange} value={formData.full_name} />
      <Input id="email" label={t("auth.email")} name="email" onChange={handleChange} type="email" value={formData.email} />
      <PasswordInput
        autoComplete="new-password"
        id="password"
        label={t("auth.password")}
        name="password"
        onChange={handleChange}
        value={formData.password}
      />
      <PasswordInput
        autoComplete="new-password"
        id="confirmPassword"
        label="Confirmer le mot de passe"
        name="confirmPassword"
        onChange={handleChange}
        value={formData.confirmPassword}
      />

      <label className="auth-legal" htmlFor="acceptLegal">
        <input
          checked={hasAcceptedLegal}
          id="acceptLegal"
          name="acceptLegal"
          onChange={(event) => setHasAcceptedLegal(event.target.checked)}
          type="checkbox"
        />
        <span>
          {t("auth.legal.prefix")}{" "}
          <Link to="/mentions-legales" title={t("auth.legal.legalNotice")}>
            {t("auth.legal.legalNotice")}
          </Link>
          ,{" "}
          <Link to="/conditions-utilisation" title={t("auth.legal.terms")}>
            {t("auth.legal.terms")}
          </Link>{" "}
          {t("auth.legal.and")}{" "}
          <Link to="/politique-confidentialite" title={t("auth.legal.privacy")}>
            {t("auth.legal.privacy")}
          </Link>
          .
        </span>
      </label>

      <button className="button button--primary" disabled={isSubmitting || !hasAcceptedLegal} type="submit">
        <UserPlus size={16} />
        {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
      </button>
      <SocialLoginButtons />
      <p className="auth-form__switch">
        {t("auth.alreadyAccount")} <Link to="/signin">{t("nav.signin")}</Link>
      </p>
    </form>
  );
}

export default SignupForm;
