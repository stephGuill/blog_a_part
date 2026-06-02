import "./EmptyState.css";

function EmptyState({ action, icon: Icon, title = "Aucun contenu", message = "Les donnees apparaitront ici." }) {
  return (
    <div className="content-card empty-state">
      {Icon ? <Icon className="empty-state__icon" size={28} /> : null}
      <div className="card-kicker">{title}</div>
      <p>{message}</p>
      {action}
    </div>
  );
}

export default EmptyState;
