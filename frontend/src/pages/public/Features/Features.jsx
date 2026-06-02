import "./Features.css";

function Features() {
  return (
    <section className="section">
      <div className="eyebrow">Fonctionnalites</div>
      <h1 className="page-title">Les briques principales de BlogYoo.</h1>
      <div className="card-grid">
        {["Blogs publics", "Articles", "Commentaires", "Roles"].map((feature) => (
          <article className="content-card" key={feature}>
            <h2 className="card-title">{feature}</h2>
            <p>Module prevu dans la structure produit.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Features;
