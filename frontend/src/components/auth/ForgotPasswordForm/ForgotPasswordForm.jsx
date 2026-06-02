import Input from "@components/ui/Input/Input";

import "./ForgotPasswordForm.css";

function ForgotPasswordForm() {
  return (
    <form className="form-card">
      <Input id="email" label="E-mail" name="email" type="email" />
      <button className="button button--primary" type="submit">Recevoir le lien</button>
    </form>
  );
}

export default ForgotPasswordForm;
