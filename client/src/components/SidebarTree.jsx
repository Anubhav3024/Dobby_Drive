import { useState } from "react";
import { formatBytes } from "../utils/formatBytes";
import { CaretIcon, FolderIcon } from "./Icons";

function TreeNode({
  node,
  level,
  currentFolderId,
  collapsedIds,
  onToggle,
  onSelect,
}) {
  const isActive = currentFolderId === node.id;
  const hasChildren = Boolean(node.children?.length);
  const isCollapsed = collapsedIds.has(node.id);

  return (
    <div>
      <div
        className={`tree-node ${isActive ? "active" : ""}`}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={isCollapsed ? "Expand folder" : "Collapse folder"}
          >
            <CaretIcon direction={isCollapsed ? "right" : "down"} />
          </button>
        ) : (
          <span style={{ width: 28, height: 28 }} />
        )}

        <span className="icon-pill" style={{ width: 28, height: 28 }}>
          <FolderIcon />
        </span>

        <span className="tree-label">{node.name}</span>
        <span className="tree-size">{formatBytes(node.aggregatedSize || 0)}</span>
      </div>

      {hasChildren && !isCollapsed
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export default function SidebarTree({ tree, currentFolderId, onSelect }) {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const handleToggle = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          currentFolderId={currentFolderId}
          collapsedIds={collapsedIds}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
