import { Link } from "react-router-dom";

import "./Forbidden.css";

function Forbidden() {
  return (
    <section className="section">
      <div className="eyebrow">403</div>
      <h1 className="page-title">Acces interdit.</h1>
      <Link className="button button--primary" to="/">Retour maison</Link>
    </section>
  );
}

export default Forbidden;
