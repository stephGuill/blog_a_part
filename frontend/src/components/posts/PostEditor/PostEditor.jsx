import "./PostEditor.css";

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
