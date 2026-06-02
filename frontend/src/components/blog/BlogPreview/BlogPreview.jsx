import "./BlogPreview.css";

function BlogPreview({ blog }) {
  return (
    <article className="content-card">
      <div className="card-kicker">Preview</div>
      <h2 className="card-title">{blog?.name || "Blog sans titre"}</h2>
      <p>{blog?.description || "Description a venir."}</p>
    </article>
  );
}

export default BlogPreview;
