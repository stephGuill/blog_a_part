import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import "./PasswordInput.css";

function PasswordInput({ id, label, name, onChange, value, autoComplete = "current-password" }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="password-input" htmlFor={id}>
      <span>{label}</span>
      <span className="password-input__control">
        <input
          autoComplete={autoComplete}
          id={id}
          name={name}
          onChange={onChange}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setIsVisible((current) => !current)}
          title={isVisible ? "Masquer" : "Afficher"}
          type="button"
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export default PasswordInput;
