// Styles CSS spécifiques au formulaire d'édition d'articles
import "./PostEditor.css";

// Composant PostEditor : formulaire de création/édition d'un article (post).
// Composant stub — les champs titre et contenu sont fonctionnels,
// mais la logique de soumission et de validation reste à implémenter.
function PostEditor() {
  return (
    <form className="form-card">
      <div className="field">
        <label htmlFor="post-title">Titre</label>
        <input id="post-title" name="title" type="text" />
      </div>
      <div className="field">
        <label htmlFor="post-content">Contenu</label>
        <textarea id="post-content" name="content" />
      </div>
    </form>
  );
}

export default PostEditor;
