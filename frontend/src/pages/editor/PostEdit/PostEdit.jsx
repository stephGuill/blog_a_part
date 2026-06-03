// Ce module réutilise directement le composant PostCreate pour la page d'édition.
// La logique de création et d'édition étant identique, PostEdit est un alias de PostCreate.
import PostCreate from "../PostCreate/PostCreate";

// Import du CSS de PostEdit (styles spécifiques à la page d'édition)
import "./PostEdit.css";

// Export par défaut : PostEdit est identique à PostCreate
// La distinction entre création et édition sera gérée via les props ou l'URL (useParams) plus tard
export default PostCreate;
