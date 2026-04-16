import { useEffect, useRef, useState } from "react";
import { DotsIcon } from "./Icons";

export default function ContextMenu({ label = "Actions", items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="ctx" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DotsIcon />
      </button>
      {open ? (
        <div className="ctx-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`ctx-item ${item.danger ? "danger" : ""}`}
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect?.();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

