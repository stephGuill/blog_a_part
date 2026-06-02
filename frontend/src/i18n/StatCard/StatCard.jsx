import "./StatCard.css";

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <div className="meta-label">{label}</div>
      <div className="stat-value">{value}</div>
    </article>
  );
}

export default StatCard;
