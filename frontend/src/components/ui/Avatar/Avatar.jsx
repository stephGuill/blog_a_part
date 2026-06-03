// Styles CSS de l'avatar (cercle, couleurs, dimensions)
import "./Avatar.css";

// Composant Avatar : affiche une photo de profil ou les initiales de l'utilisateur.
// Props :
//   name — nom complet de l'utilisateur (ex : "Alice Martin")
//           Utilisé pour calculer les initiales ET comme texte alternatif de l'image
//           Valeur par défaut : "BlogYoo" si aucun nom n'est fourni
//   src  — URL de la photo de profil (optionnel)
//           Si absent : affiche les initiales calculées depuis le nom
function Avatar({ name = "BlogYoo", src }) {
  // Calcul des initiales :
  //   1. split(" ") — découpe le nom en mots ["Alice", "Martin"]
  //   2. map((part) => part[0]) — extrait la première lettre de chaque mot ["A", "M"]
  //   3. join("") — joint les lettres en une seule chaîne "AM"
  //   4. slice(0, 2) — limite à 2 caractères (évite les initiales trop longues)
  //   5. toUpperCase() — met en majuscules pour une présentation cohérente
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="avatar">
      {/* Si une URL d'image est fournie, affiche l'image ; sinon affiche les initiales */}
      {src ? <img alt={name} src={src} /> : initials}
    </span>
  );
}

// Export par défaut utilisé dans la Topbar, les listes d'utilisateurs et les commentaires
export default Avatar;
