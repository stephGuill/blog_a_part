import "./ThemeToggle.css";

function ThemeToggle({ isDark = false, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} type="button">
      {isDark ? "Clair" : "Sombre"}
    </button>
  );
}

export default ThemeToggle;
