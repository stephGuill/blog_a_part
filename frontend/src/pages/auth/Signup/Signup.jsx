import SignupForm from "@components/auth/SignupForm/SignupForm";

import "./Signup.css";

function Signup() {
  return (
    <section className="section">
      <div className="eyebrow">Inscription</div>
      <h1 className="page-title">Creer un compte BlogYoo.</h1>
      <SignupForm />
    </section>
  );
}

export default Signup;
