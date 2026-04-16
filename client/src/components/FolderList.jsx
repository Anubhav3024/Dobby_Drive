import { formatBytes } from "../utils/formatBytes";
import { FolderIcon } from "./Icons";
import ContextMenu from "./ContextMenu";

export default function FolderList({
  folders,
  onOpen,
  onDelete,
  onRename,
  onDetails,
  onBack,
  editingFolderId,
  editingValue,
  onEditChange,
  onEditCancel,
  onEditSave,
}) {
  return (
    <div className="folder-grid">
      {onBack ? (
        <div
          role="button"
          tabIndex={0}
          className="card"
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onBack();
          }}
        >
          <div className="card-top">
            <span className="icon-pill" aria-hidden="true">
              <FolderIcon />
            </span>
            <span className="muted">Back</span>
          </div>
          <div className="card-title">Back</div>
          <div className="card-meta">
            <span>Go to parent folder</span>
          </div>
        </div>
      ) : null}

      {folders.map((folder) => (
        <div key={folder.id}>
        <div
          className="card"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (editingFolderId === folder.id) return;
            onOpen(folder.id);
          }}
          onKeyDown={(e) => {
            if (editingFolderId === folder.id) return;
            if (e.key === "Enter" || e.key === " ") onOpen(folder.id);
          }}
          style={{ textAlign: "left" }}
        >
          <div className="card-top">
            <span className="icon-pill" aria-hidden="true">
              <FolderIcon />
            </span>
            {editingFolderId === folder.id ? null : (
              <ContextMenu
                label="Folder actions"
                items={[
                  {
                    key: "details",
                    label: "Details",
                    onSelect: () => onDetails?.(folder),
                  },
                  {
                    key: "rename",
                    label: "Rename",
                    onSelect: () => onRename?.(folder),
                  },
                  {
                    key: "delete",
                    label: "Delete",
                    danger: true,
                    onSelect: () => onDelete(folder.id),
                  },
                ]}
              />
            )}
          </div>
          {editingFolderId === folder.id ? (
            <div className="inline-edit" onClick={(e) => e.stopPropagation()}>
              <input
                className="inline-input"
                value={editingValue}
                onChange={(e) => onEditChange?.(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") onEditCancel?.();
                  if (e.key === "Enter") onEditSave?.(folder);
                }}
              />
              <div className="inline-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onEditCancel?.()}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onEditSave?.(folder)}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-title">{folder.name}</div>
              <div className="card-meta">
                <span>
                  {(folder.fileCount ?? 0).toString()} files •{" "}
                  {formatBytes(folder.aggregatedSize || 0)}
                </span>
              </div>
            </>
          )}
        </div>
        </div>
      ))}
    </div>
  );
}
