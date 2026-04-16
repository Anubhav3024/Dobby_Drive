import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import {
  createFolder,
  deleteFolder,
  getFolderTree,
  listFolders,
  renameFolder,
} from "../api/folders";
import { deleteFile, listFiles, uploadFile } from "../api/files";
import SidebarTree from "../components/SidebarTree";
import FolderList from "../components/FolderList";
import FileGrid from "../components/FileGrid";
import Breadcrumbs from "../components/Breadcrumbs";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import EmptyState from "../components/EmptyState";
import { buildTree } from "../utils/buildTree";
import { formatBytes } from "../utils/formatBytes";
import { formatDateTime } from "../utils/formatDateTime";
import {
  ChevronLeftIcon,
  BoxIcon,
  DriveIcon,
  MoonIcon,
  SunIcon,
  UploadIcon,
} from "../components/Icons";
import ProfileMenu from "../components/ProfileMenu";
import { useToast } from "../providers/ToastProvider";
import { ASSET_BASE_URL } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast, updateToast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const { folderId } = useParams();
  const [currentFolderId, setCurrentFolderId] = useState(folderId || null);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [uploadAsset, setUploadAsset] = useState(null);
  const [modalError, setModalError] = useState("");
  const [detailsItem, setDetailsItem] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderValue, setEditingFolderValue] = useState("");

  const treeQuery = useQuery({
    queryKey: ["folderTree"],
    queryFn: getFolderTree,
  });

  const folderListQuery = useQuery({
    queryKey: ["folders", currentFolderId],
    queryFn: () => listFolders({ parentFolderId: currentFolderId }),
  });

  const fileListQuery = useQuery({
    queryKey: ["files", currentFolderId],
    queryFn: () => listFiles({ folderId: currentFolderId }),
    enabled: Boolean(currentFolderId),
  });

  const folderTree = useMemo(
    () => buildTree(treeQuery.data || []),
    [treeQuery.data],
  );

  const totalUsed = useMemo(() => {
    return (folderTree || []).reduce(
      (sum, node) => sum + (node.aggregatedSize || 0),
      0,
    );
  }, [folderTree]);

  const folderMap = useMemo(() => {
    const map = new Map();
    (treeQuery.data || []).forEach((folder) => {
      map.set(folder.id, folder);
    });
    return map;
  }, [treeQuery.data]);

  const currentFolder = currentFolderId ? folderMap.get(currentFolderId) : null;
  const breadcrumbItems = currentFolder
    ? currentFolder.path.map((id) => folderMap.get(id)).filter(Boolean)
    : [];
  const parentFolderId = currentFolder?.parentFolderId || null;

  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId]);

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
    setTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
      setIsCreateOpen(false);
      setFolderName("");
      setModalError("");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      setIsUploadOpen(false);
      setUploadAsset(null);
      setModalError("");
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, payload }) => renameFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
      setEditingFolderId(null);
      setEditingFolderValue("");
      setModalError("");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
    },
  });

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    setModalError("");
    try {
      await createFolderMutation.mutateAsync({
        name: folderName,
        parentFolderId: currentFolderId,
      });
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to create folder");
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setModalError("");
    if (!uploadAsset) {
      setModalError("Please select an image file");
      return;
    }
    try {
      const toastId = addToast({
        title: "Uploading…",
        message: uploadAsset.name,
        type: "info",
        progress: 0,
        autoCloseMs: 0,
      });
      await uploadMutation.mutateAsync({
        folderId: currentFolderId,
        file: uploadAsset,
        name: fileTitle || uploadAsset.name,
        onProgress: (p) => updateToast(toastId, { progress: p }),
      });
      updateToast(toastId, {
        title: "Uploaded",
        type: "success",
        progress: 100,
      });
      window.setTimeout(() => removeToast(toastId), 1200);
      setFileTitle("");
    } catch (err) {
      setModalError(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDroppedFiles = async (fileList) => {
    if (!currentFolderId) {
      addToast({
        title: "Select a folder first",
        message: "Choose a folder from the sidebar to upload into.",
        type: "info",
      });
      return;
    }

    const files = Array.from(fileList || []).filter((f) =>
      String(f.type || "").startsWith("image/"),
    );

    if (files.length === 0) {
      addToast({
        title: "No images found",
        message: "Drop image files (png/jpg/webp, etc).",
        type: "info",
      });
      return;
    }

    for (const file of files) {
      const toastId = addToast({
        title: "Uploading…",
        message: file.name,
        type: "info",
        progress: 0,
        autoCloseMs: 0,
      });
      try {
        await uploadMutation.mutateAsync({
          folderId: currentFolderId,
          file,
          name: file.name,
          onProgress: (p) => updateToast(toastId, { progress: p }),
        });
        updateToast(toastId, {
          title: "Uploaded",
          type: "success",
          progress: 100,
        });
        window.setTimeout(() => removeToast(toastId), 1200);
      } catch (err) {
        updateToast(toastId, {
          title: "Upload failed",
          type: "error",
          progress: null,
          message: err.response?.data?.message || "Upload failed",
          autoCloseMs: 3500,
        });
        window.setTimeout(() => removeToast(toastId), 3500);
      }
    }
  };

  const openRenameFolder = (folder) => {
    setEditingFolderId(folder?.id || null);
    setEditingFolderValue(folder?.name || "");
    setModalError("");
  };

  const cancelInlineRename = () => {
    setEditingFolderId(null);
    setEditingFolderValue("");
    setModalError("");
  };

  const saveInlineRename = async (folder) => {
    if (!folder?.id) return;
    setModalError("");
    try {
      await renameFolderMutation.mutateAsync({
        id: folder.id,
        payload: { name: editingFolderValue },
      });
    } catch (err) {
      addToast({
        title: "Rename failed",
        message: err.response?.data?.message || "Unable to rename folder",
        type: "error",
      });
    }
  };

  const downloadFromFile = (file) => {
    window.open(
      `${ASSET_BASE_URL}/api/files/${file.id}/download`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleDeleteFolder = (folderId) => {
    const confirmed = window.confirm(
      "Delete this folder and all nested content?",
    );
    if (confirmed) {
      if (folderId === currentFolderId) {
        setCurrentFolderId(null);
      }
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleDeleteFile = (fileId) => {
    const confirmed = window.confirm("Delete this image?");
    if (confirmed) {
      deleteFileMutation.mutate(fileId);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div className="brand">
            <span className="brand-badge" aria-hidden="true">
              <DriveIcon width="18" height="18" />
            </span>
            <span>Dobby Drive</span>
          </div>
        </div>

        <div className="nav">
          <button
            type="button"
            className={`nav-item ${currentFolderId ? "" : "active"}`}
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>

        <div className="muted" style={{ fontWeight: 800, marginTop: 6 }}>
          My Folders
        </div>
        <div className="tree">
          {treeQuery.isLoading ? (
            <div className="loader">Loading folders...</div>
          ) : treeQuery.isError ? (
            <div className="empty-state">
              <h4>Unable to load folders</h4>
              <p>Check your server connection and try again.</p>
            </div>
          ) : (
            <SidebarTree
              tree={folderTree}
              currentFolderId={currentFolderId}
              onSelect={(id) => navigate(`/folders/${id}`)}
            />
          )}
        </div>

        <div className="sidebar-footer">
          <div>
            <div className="muted" style={{ fontWeight: 700 }}>
              Storage used
            </div>
            <div style={{ fontWeight: 850, marginTop: 2 }}>
              {formatBytes(totalUsed)}
            </div>
            <div className="muted" style={{ marginTop: 10 }}>
              {user?.email || ""}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline sidebar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className="icon-btn"
              disabled={!currentFolderId}
              onClick={() =>
                navigate(parentFolderId ? `/folders/${parentFolderId}` : "/")
              }
              title="Back"
            >
              <ChevronLeftIcon />
            </button>
            <Breadcrumbs
              items={breadcrumbItems}
              onNavigate={(id) => navigate(id ? `/folders/${id}` : "/")}
            />
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <ProfileMenu user={user} />
          </div>
        </header>

        <div
          className="content"
          onDragEnter={(e) => {
            if (!e.dataTransfer?.types?.includes("Files")) return;
            setIsDragOver(true);
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer?.types?.includes("Files")) return;
            e.preventDefault();
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            if (!e.dataTransfer?.files?.length) return;
            e.preventDefault();
            setIsDragOver(false);
            handleDroppedFiles(e.dataTransfer.files);
          }}
        >
          {isDragOver ? (
            <div className="drop-overlay" aria-hidden="true">
              <div className="drop-card">
                <div style={{ fontWeight: 850, marginBottom: 6 }}>
                  Drop images to upload
                </div>
                <div className="muted">
                  Upload into the currently selected folder.
                </div>
              </div>
            </div>
          ) : null}
          <div className="page-title">
            <div>
              <h2>My Folders</h2>
              <div className="muted">Organize images with nested folders.</div>
            </div>
            <div className="header-actions">
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                New folder
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsUploadOpen(true)}
                disabled={!currentFolderId}
              >
                <UploadIcon />
                Upload image
              </Button>
            </div>
          </div>

          <div className="dashboard-panels">
            <section className="section dashboard-panel">
              <div className="section-header">
                <div className="section-title">Folders</div>
              </div>
              {folderListQuery.isLoading ? (
                <div className="loader">Loading folders...</div>
              ) : folderListQuery.isError ? (
                <EmptyState
                  title="Unable to load folders"
                  description="This folder may not exist anymore, or the server rejected the request."
                  icon={<BoxIcon />}
                  actionLabel="Go to Home"
                  onAction={() => navigate("/")}
                />
              ) : folderListQuery.data?.items?.length ? (
                <FolderList
                  folders={folderListQuery.data.items}
                  onOpen={(id) => navigate(`/folders/${id}`)}
                  onDelete={handleDeleteFolder}
                  onRename={openRenameFolder}
                  onDetails={(folder) =>
                    setDetailsItem({ type: "folder", folder })
                  }
                  editingFolderId={editingFolderId}
                  editingValue={editingFolderValue}
                  onEditChange={setEditingFolderValue}
                  onEditCancel={cancelInlineRename}
                  onEditSave={saveInlineRename}
                  onBack={
                    currentFolderId && parentFolderId
                      ? () => navigate(`/folders/${parentFolderId}`)
                      : null
                  }
                />
              ) : (
                <EmptyState
                  title="No folders here"
                  description="Create a folder to start organizing your files."
                  icon={<BoxIcon />}
                  actionLabel="New folder"
                  onAction={() => setIsCreateOpen(true)}
                />
              )}
            </section>

            <section className="section dashboard-panel">
              <div className="section-header">
                <div className="section-title">Uploaded Images</div>
              </div>
              {currentFolderId ? (
                fileListQuery.isLoading ? (
                  <div className="loader">Loading images...</div>
                ) : fileListQuery.isError ? (
                  <EmptyState
                    title="Unable to load images"
                    description="This folder may not exist anymore, or you don't have access."
                    icon={<UploadIcon />}
                    actionLabel="Go to Home"
                    onAction={() => navigate("/")}
                  />
                ) : fileListQuery.data?.items?.length ? (
                  <FileGrid
                    files={fileListQuery.data.items}
                    onDelete={handleDeleteFile}
                    onDetails={(file) => setDetailsItem({ type: "file", file })}
                    onDownload={downloadFromFile}
                  />
                ) : (
                  <EmptyState
                    title="No images yet"
                    description="Upload an image to populate this folder."
                    icon={<UploadIcon />}
                    actionLabel="Upload image"
                    onAction={() => setIsUploadOpen(true)}
                  />
                )
              ) : (
                <EmptyState
                  title="Select a folder"
                  description="Pick a folder from the tree to view its images."
                  icon={<BoxIcon />}
                />
              )}
            </section>
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(detailsItem)}
        title="Details"
        onClose={() => setDetailsItem(null)}
      >
        {detailsItem?.type === "folder" ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="muted">Folder</div>
              <div style={{ fontWeight: 850 }}>
                {detailsItem.folder?.name || ""}
              </div>
            </div>
            <div className="card-meta">
              <span>
                {(detailsItem.folder?.fileCount ?? 0).toString()} files
              </span>
              <span>•</span>
              <span>
                {formatBytes(detailsItem.folder?.aggregatedSize || 0)} used
              </span>
            </div>
            <div className="details-grid">
              <div className="details-row">
                <div className="muted">Created</div>
                <div>{formatDateTime(detailsItem.folder?.createdAt)}</div>
              </div>
              <div className="details-row">
                <div className="muted">Updated</div>
                <div>{formatDateTime(detailsItem.folder?.updatedAt)}</div>
              </div>
            </div>
          </div>
        ) : detailsItem?.type === "file" ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="muted">Image</div>
              <div style={{ fontWeight: 850 }}>{detailsItem.file?.name}</div>
              <div className="muted">{detailsItem.file?.originalName}</div>
            </div>
            <div className="card-meta">
              <span>{formatBytes(detailsItem.file?.size || 0)}</span>
              <span>•</span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => downloadFromFile(detailsItem.file)}
              >
                Download
              </button>
            </div>
            <div className="details-grid">
              <div className="details-row">
                <div className="muted">Created</div>
                <div>{formatDateTime(detailsItem.file?.createdAt)}</div>
              </div>
              <div className="details-row">
                <div className="muted">Updated</div>
                <div>{formatDateTime(detailsItem.file?.updatedAt)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        title="Create folder"
        onClose={() => {
          setIsCreateOpen(false);
          setModalError("");
        }}
      >
        <form onSubmit={handleCreateFolder}>
          <Input
            label="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            required
          />
          {modalError ? <div className="alert">{modalError}</div> : null}
          <div className="form-actions">
            <Button type="submit">Create</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUploadOpen}
        title="Upload image"
        onClose={() => {
          setIsUploadOpen(false);
          setModalError("");
        }}
      >
        <form onSubmit={handleUpload}>
          <Input
            label="Image Name"
            value={fileTitle}
            onChange={(event) => setFileTitle(event.target.value)}
            placeholder="e.g. Campaign Banner"
            required
          />
          <Input
            label="Choose image"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setUploadAsset(event.target.files?.[0] || null)
            }
            required
          />
          {modalError ? <div className="alert">{modalError}</div> : null}
          <div className="form-actions">
            <Button type="submit">Upload</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
