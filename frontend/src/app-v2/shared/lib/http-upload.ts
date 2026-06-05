import axios from "axios";
import { env } from "./env";
import { authStorage } from "./storage";

const uploadClient = axios.create({
  baseURL: env.apiBaseUrl,
});

uploadClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export async function apiFormUpload<T>(path: string, formData: FormData): Promise<T> {
  try {
    const response = await uploadClient.post<T>(path, formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string; title?: string } | undefined;
      const message =
        data?.message ??
        data?.title ??
        (error.response?.status === 403
          ? "You do not have permission to upload images."
          : `Upload failed (${error.response?.status ?? "network error"}).`);
      throw new Error(message);
    }
    throw error;
  }
}
