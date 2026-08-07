import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// File uploads (image/PDF attachments) go through fetch instead of the shared
// axios instance above. Axios instance defaults set Content-Type: application/json,
// and manually overriding it to "multipart/form-data" per-request omits the
// boundary the server needs to parse the body — the browser can only add that
// boundary automatically if we don't set Content-Type ourselves at all. fetch
// with a raw FormData body does this correctly with zero manual header setup.
export async function postGenerateWithFile(formData) {
  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.response = { data };
    throw error;
  }

  return { data };
}

export default apiClient;