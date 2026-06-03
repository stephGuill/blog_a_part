// Icône lucide-react : Save pour le bouton de sauvegarde des réglages de thème
import { Save } from "lucide-react";

// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";

// Styles CSS propres au customiseur de thème
import "./ThemeCustomizer.css";

// Composant page : interface de personnalisation visuelle d'un blog
// Permet à l'owner de régler la couleur, la typographie, le radius et la densité en preview live
function ThemeCustomizer() {
  return (
    // Section principale de la page de personnalisation de thème
    <section className="by-page theme-customizer">

      {/* En-tête : titre descriptif + bouton de sauvegarde du thème */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel */}
          <div className="by-eyebrow">Theme customizer</div>
          {/* Titre principal de la page */}
          <h1>Personnaliser l'identite d'un blog.</h1>
        </div>
        {/* Bouton de sauvegarde du thème personnalisé (non branché API pour l'instant) */}
        <Button icon={Save}>Sauvegarder</Button>
      </header>

      {/* Grille deux colonnes : panneau de contrôles (gauche) | prévisualisation (droite) */}
      <div className="customizer-grid">

        {/* Panneau gauche : sliders de réglage des paramètres visuels */}
        <aside className="card-shell customizer-controls">
          {/* Itération sur les 4 paramètres de personnalisation disponibles */}
          {["Couleur principale", "Typographie", "Radius", "Densite"].map((label) => (
            // Champ slider pour chaque paramètre visuel
            // defaultValue 62 = position initiale du curseur (valeur par défaut)
            <label className="field" key={label}>
              <span>{label}</span>
              {/* Slider de 0 à 100, position initiale à 62 */}
              <input type="range" min="0" max="100" defaultValue="62" />
            </label>
          ))}
        </aside>

        {/* Panneau droit : prévisualisation en temps réel du thème personnalisé */}
        <article className="card-shell customizer-preview">
          {/* Label de section */}
          <div className="by-eyebrow">Preview</div>
          {/* Titre d'exemple stylisé dans la police et la couleur du thème */}
          <h2>Une lecture douce et distinctive.</h2>
          {/* Description d'exemple reflétant la palette éditoriale BlogYoo */}
          <p>La palette BlogYoo garde une base cream, du sky et un accent peach.</p>
          {/* Swatches de couleurs : 4 blocs colorés représentant la palette active */}
          {/* coral, sky, gold, success — chaque couleur est définie en CSS via nth-child */}
          <div className="theme-swatches"><span /><span /><span /><span /></div>
        </article>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default ThemeCustomizer;
