import "./Pricing.css";

function Pricing() {
  return (
    <section className="section">
      <div className="eyebrow">Tarifs</div>
      <h1 className="page-title">Une base SaaS prete pour vos futures offres.</h1>
      <div className="card-grid">
        {["Starter", "Equipe", "Plateforme"].map((plan) => (
          <article className="content-card" key={plan}>
            <div className="card-kicker">{plan}</div>
            <h2 className="card-title">A definir</h2>
            <p>Le contenu tarifaire sera precise avec votre equipe.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Pricing;
