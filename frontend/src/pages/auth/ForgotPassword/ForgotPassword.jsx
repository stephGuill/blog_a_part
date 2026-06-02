import ForgotPasswordForm from "@components/auth/ForgotPasswordForm/ForgotPasswordForm";

import "./ForgotPassword.css";

function ForgotPassword() {
  return (
    <section className="section">
      <div className="eyebrow">Mot de passe oublie</div>
      <h1 className="page-title">Recevoir un lien de recuperation.</h1>
      <ForgotPasswordForm />
    </section>
  );
}

export default ForgotPassword;
