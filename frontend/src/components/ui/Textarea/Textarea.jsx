import "./Textarea.css";

function Textarea({ label, id, ...props }) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <textarea id={id} {...props} />
    </div>
  );
}

export default Textarea;
