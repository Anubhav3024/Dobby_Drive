import api from "./client";

export async function listFolders({ parentFolderId, page = 1, limit = 50 }) {
  const params = { page, limit };
  if (parentFolderId !== undefined && parentFolderId !== null) {
    params.parentFolderId = parentFolderId;
  }
  const { data } = await api.get("/folders", { params });
  return data;
}

export async function getFolderTree() {
  const { data } = await api.get("/folders/tree");
  return data.items;
}

export async function createFolder(payload) {
  const { data } = await api.post("/folders", payload);
  return data.folder;
}

export async function renameFolder(id, payload) {
  const { data } = await api.patch(`/folders/${id}`, payload);
  return data.folder;
}

export async function deleteFolder(id) {
  const { data } = await api.delete(`/folders/${id}`);
  return data;
}
