import api from "./client";

export async function listFiles({ folderId, page = 1, limit = 50 }) {
  const { data } = await api.get("/files", {
    params: { folderId, page, limit },
  });
  return data;
}

export async function uploadFile({ folderId, file, name, onProgress }) {
  const formData = new FormData();
  formData.append("folderId", folderId);
  formData.append("name", name);
  formData.append("image", file);

  const { data } = await api.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || 0;
      if (!total) return;
      const percent = Math.round((evt.loaded / total) * 100);
      onProgress(percent);
    },
  });
  return data.file;
}

export async function deleteFile(id) {
  const { data } = await api.delete(`/files/${id}`);
  return data;
}
