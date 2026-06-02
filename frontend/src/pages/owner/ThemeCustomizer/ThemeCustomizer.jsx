import { Save } from "lucide-react";

import Button from "@components/ui/Button/Button";

import "./ThemeCustomizer.css";

function ThemeCustomizer() {
  return (
    <section className="by-page theme-customizer">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Theme customizer</div>
          <h1>Personnaliser l'identite d'un blog.</h1>
        </div>
        <Button icon={Save}>Sauvegarder</Button>
      </header>

      <div className="customizer-grid">
        <aside className="card-shell customizer-controls">
          {["Couleur principale", "Typographie", "Radius", "Densite"].map((label) => (
            <label className="field" key={label}>
              <span>{label}</span>
              <input type="range" min="0" max="100" defaultValue="62" />
            </label>
          ))}
        </aside>
        <article className="card-shell customizer-preview">
          <div className="by-eyebrow">Preview</div>
          <h2>Une lecture douce et distinctive.</h2>
          <p>La palette BlogYoo garde une base cream, du sky et un accent peach.</p>
          <div className="theme-swatches"><span /><span /><span /><span /></div>
        </article>
      </div>
    </section>
  );
}

export default ThemeCustomizer;
