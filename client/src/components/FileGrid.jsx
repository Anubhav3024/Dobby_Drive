import { formatBytes } from "../utils/formatBytes";
import { ASSET_BASE_URL } from "../api/client";
import ContextMenu from "./ContextMenu";

const FALLBACK_THUMBNAIL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
    '<rect width="600" height="400" fill="#f3f4f6"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Inter,system-ui,-apple-system,Segoe UI,sans-serif" font-size="24">Preview unavailable</text>' +
    "</svg>",
)}`;

export default function FileGrid({ files, onDelete, onDetails, onDownload }) {
  return (
    <div className="file-grid">
      {files.map((file) => (
        <div key={file.id} className="card">
          <img
            className="file-preview"
            src={`${ASSET_BASE_URL}${file.storageUrl}`}
            alt={file.originalName}
            loading="lazy"
            crossOrigin="use-credentials"
            onError={(e) => {
              // If the image is blocked/missing, swap in a clean placeholder instead of a broken icon.
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_THUMBNAIL;
            }}
          />
          <div className="card-top" style={{ marginBottom: 6 }}>
            <div style={{ minWidth: 0 }}>
              <div className="card-title">{file.name}</div>
              <div className="muted">{formatBytes(file.size)}</div>
            </div>
            <ContextMenu
              label="Image actions"
              items={[
                {
                  key: "details",
                  label: "Details",
                  onSelect: () => onDetails?.(file),
                },
                {
                  key: "download",
                  label: "Download",
                  onSelect: () => onDownload?.(file),
                },
                {
                  key: "delete",
                  label: "Delete",
                  danger: true,
                  onSelect: () => onDelete(file.id),
                },
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
