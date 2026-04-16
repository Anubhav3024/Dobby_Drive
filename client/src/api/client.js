import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: rawBaseUrl,
  withCredentials: true,
});

const assetBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "");

export const ASSET_BASE_URL = assetBaseUrl;

export default api;
