export default function Breadcrumbs({ items, onNavigate }) {
  return (
    <div className="breadcrumbs">
      <button type="button" onClick={() => onNavigate(null)}>
        Home
      </button>
      {items.map((item) => (
        <span key={item.id}>
          /{" "}
          <button type="button" onClick={() => onNavigate(item.id)}>
            {item.name}
          </button>
        </span>
      ))}
    </div>
  );
}
