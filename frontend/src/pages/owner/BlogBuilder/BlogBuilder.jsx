import { Columns3, Image, Type } from "lucide-react";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";

import "./BlogBuilder.css";

const blocks = [
  { label: "Titre hero", icon: Type },
  { label: "Image couverture", icon: Image },
  { label: "Grille articles", icon: Columns3 },
];

function BlogBuilder() {
  return (
    <section className="by-page blog-builder">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Builder</div>
          <h1>Composer un blog par blocs.</h1>
          <p className="text-muted">Une base JSON visuelle pour preparer le futur builder complet.</p>
        </div>
        <Button>Sauvegarder</Button>
      </header>

      <div className="builder-grid">
        <aside className="card-shell builder-panel">
          <div className="by-eyebrow">Blocs</div>
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <button className="builder-block" key={block.label} type="button">
                <Icon size={18} /> {block.label}
              </button>
            );
          })}
        </aside>

        <main className="card-shell builder-preview">
          <Badge tone="info">Preview live</Badge>
          <h2>Horizons editoriaux</h2>
          <p>Un blog clair, immersif, avec une structure qui respecte la lecture longue.</p>
          <div className="builder-preview__cards"><span /><span /><span /></div>
        </main>

        <aside className="card-shell builder-panel">
          <div className="by-eyebrow">Configuration</div>
          <label className="field"><span>Slug</span><input defaultValue="horizons-editoriaux" /></label>
          <label className="field"><span>Statut</span><select defaultValue="published"><option value="published">Publie</option><option value="draft">Brouillon</option></select></label>
        </aside>
      </div>
    </section>
  );
}

export default BlogBuilder;
