export default function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-icon" aria-hidden="true">{icon}</div> : null}
      <h4>{title}</h4>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
