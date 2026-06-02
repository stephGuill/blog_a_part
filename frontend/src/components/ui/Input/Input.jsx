import "./Input.css";

function Input({ label, id, ...props }) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input id={id} {...props} />
    </div>
  );
}

export default Input;
