import "./Dropdown.css";

function Dropdown({ label = "Actions", children }) {
  return (
    <details className="dropdown">
      <summary>{label}</summary>
      <div className="dropdown__menu">{children}</div>
    </details>
  );
}

export default Dropdown;
