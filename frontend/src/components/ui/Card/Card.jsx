import "./Card.css";

function Card({ children, className = "", variant = "default" }) {
  return (
    <section className={`card-shell card-shell--${variant} ${className}`.trim()}>
      {children}
    </section>
  );
}

export default Card;
