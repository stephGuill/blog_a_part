// BlogExplore : alias de route vers la page de liste des blogs.
// Importe et ré-exporte directement le composant Blogs pour la route "/explore".
// Cela évite la duplication de code tout en permettant une URL distincte.
import Blogs from "../Blogs/Blogs";

// Styles CSS propres à la variante "explore" (peut surcharger les styles de Blogs)
import "./BlogExplore.css";

// Re-export direct du composant Blogs comme composant de cette page
export default Blogs;
