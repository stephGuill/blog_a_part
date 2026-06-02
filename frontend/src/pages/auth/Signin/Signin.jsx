import SigninForm from "@components/auth/SigninForm/SigninForm";

import "./Signin.css";

function Signin() {
  return (
    <section className="section">
      <div className="eyebrow">Connexion</div>
      <h1 className="page-title">Acceder a votre espace.</h1>
      <SigninForm />
    </section>
  );
}

export default Signin;
