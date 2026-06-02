import { Link } from "react-router-dom";

import "./NotFound.css";

function NotFound() {
  return (
    <section className="section">
      <div className="eyebrow">404</div>
      <h1 className="page-title">Page introuvable.</h1>
      <Link className="button button--primary" to="/">Retour maison</Link>
    </section>
  );
}

export default NotFound;
