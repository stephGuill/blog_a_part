// ImagePlus : icône pour le bouton d'ajout d'avatar (bibliothèque lucide-react)
// X : icône de croix pour le bouton de suppression de l'avatar sélectionné
import { ImagePlus, X } from "lucide-react";

// useMemo : mémoïse une valeur calculée pour éviter les recalculs inutiles à chaque rendu
// useState : gère l'état local du composant (URL de prévisualisation)
import { useMemo, useState } from "react";

// Styles CSS spécifiques au composant AvatarUpload
import "./AvatarUpload.css";

// Taille maximale autorisée pour l'avatar : 2 Mo exprimé en octets
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

// Types MIME acceptés pour l'avatar : JPEG, JPG, PNG et WebP
const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Composant de téléchargement d'avatar avec prévisualisation
// file : le fichier File actuellement sélectionné (géré par le parent)
// onChange : callback appelé quand l'utilisateur sélectionne ou retire un fichier
// onError : callback optionnel pour remonter les messages d'erreur au composant parent
function AvatarUpload({ file, onChange, onError }) {
  // useState gère l'URL de prévisualisation locale (URL.createObjectURL)
  // Chaîne vide signifie qu'aucun fichier n'est en cours de prévisualisation
  const [previewUrl, setPreviewUrl] = useState("");

  // useMemo mémoïse l'URL de prévisualisation — évite de la recalculer si rien n'a changé
  // Ici c'est simple mais utile si previewUrl était calculée de façon complexe
  const preview = useMemo(() => previewUrl, [previewUrl]);

  // Gestionnaire de changement du champ <input type="file">
  // Valide le type MIME et la taille, puis crée une URL de prévisualisation
  const handleChange = (event) => {
    // Récupère le premier fichier sélectionné (on n'accepte qu'un seul fichier)
    const nextFile = event.target.files?.[0];

    // Si aucun fichier n'a été sélectionné, on sort immédiatement
    if (!nextFile) {
      return;
    }

    // Validation : vérifie le type MIME ET la taille du fichier
    // Si le fichier est invalide, on réinitialise le champ et on signale l'erreur
    if (!allowedTypes.includes(nextFile.type) || nextFile.size > MAX_AVATAR_SIZE) {
      event.target.value = ""; // Réinitialise l'input pour permettre une nouvelle sélection
      onChange(null);           // Signale au parent qu'il n'y a plus de fichier valide
      onError?.("Avatar invalide. Formats: JPG, PNG, WEBP. Taille max: 2 Mo."); // Remonte l'erreur
      return;
    }

    // Si le fichier est valide, on efface toute erreur précédente
    onError?.("");

    // Informe le composant parent du nouveau fichier sélectionné
    onChange(nextFile);

    // Crée une URL temporaire en mémoire pour afficher la prévisualisation sans upload
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  // Fonction de réinitialisation : supprime l'avatar sélectionné
  const clearAvatar = () => {
    onChange(null);      // Informe le parent qu'il n'y a plus de fichier
    setPreviewUrl("");   // Efface l'URL de prévisualisation
  };

  return (
    // Conteneur principal du composant d'upload d'avatar
    <div className="avatar-upload">
      {/* Zone de prévisualisation : affiche l'image ou l'icône par défaut */}
      {/* aria-hidden="true" : masqué aux lecteurs d'écran car c'est décoratif */}
      <div className="avatar-upload__preview" aria-hidden="true">
        {/* Rendu conditionnel : si une prévisualisation existe, affiche l'image, sinon l'icône */}
        {preview ? <img alt="" src={preview} /> : <ImagePlus size={26} />}
      </div>

      {/* Contenu textuel : bouton de sélection et texte d'aide */}
      <div className="avatar-upload__content">
        {/* htmlFor="avatar" lie ce label à l'input#avatar — clic sur le label = clic sur l'input */}
        <label className="avatar-upload__button" htmlFor="avatar">
          <ImagePlus size={16} />
          {/* Texte dynamique selon qu'un fichier est déjà sélectionné */}
          {file ? "Changer la photo" : "Choisir une photo"}
        </label>
        {/* Input de sélection de fichier masqué visuellement (accessible via le label) */}
        {/* accept : filtre les fichiers affichés dans l'explorateur */}
        <input accept=".jpg,.jpeg,.png,.webp" id="avatar" name="avatar" onChange={handleChange} type="file" />
        {/* Texte d'aide indiquant les formats et la taille maximale */}
        <p>JPG, PNG ou WEBP. 2 Mo maximum.</p>
      </div>

      {/* Rendu conditionnel : bouton de suppression affiché uniquement si un fichier est sélectionné */}
      {file ? (
        <button
          aria-label="Retirer l'avatar" // Texte accessible pour les lecteurs d'écran
          className="avatar-upload__clear"
          onClick={clearAvatar}          // Réinitialise l'avatar au clic
          title="Retirer"               // Info-bulle au survol
          type="button"                 // type="button" évite la soumission accidentelle du formulaire
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

export default AvatarUpload;
